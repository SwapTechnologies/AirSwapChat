import { Injectable } from '@angular/core';

// services
import { ConnectWeb3Service } from './connectWeb3.service';
import { ConnectionService } from './connection.service';
import { FirebaseService } from './firebase.service';
import { WebsocketService } from './websocket.service';

import { Message, StoredMessage, OtherUser, Peer } from '../types/types';

import { MatDialog } from '@angular/material';
import { DialogSendOfflineComponent } from '../message-system/dialog-send-offline/dialog-send-offline.component';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  public connectedPeers: Peer[] = [];
  public selectedPeer: Peer;

  private websocketSubscription: any;

  public showMessenger = false;
  public gotMessagesFromDatabase = false;
  public sendingMessage = false;


  constructor(
    private web3service: ConnectWeb3Service,
    private wsService: WebsocketService,
    private connectionService: ConnectionService,
    private firebaseService: FirebaseService,
    public dialog: MatDialog,
  ) { }

  get unreadMessages(): number {
    let nUnread = 0;
    for (const peer of this.connectedPeers) {
      if (peer.hasUnreadMessages) { nUnread += 1; }
    }
    return nUnread;
  }

  setMessageRead(): void {
    this.selectedPeer.hasUnreadMessages = false;
    if (this.gotMessagesFromDatabase) {
      if (this.selectedPeer.uid) {
        this.firebaseService.removeUnreceivedMessages(this.selectedPeer.uid)
        .then(remainingMessages => {
          if (remainingMessages === 0) {
            this.gotMessagesFromDatabase = false;
          }
        });
      }
    }
  }

  startMessenger(): void {
    console.log('Starting the messenger.');
    // check firebase for unread messages
    const promiseList = [];
    this.firebaseService.getUnreceivedMessages()
    .then(unreceivedMessages => {
      for (const message of unreceivedMessages) {
        // get details of all message senders
        promiseList.push(
          this.firebaseService.getUserDetails(message.uid)
          .then((userDetails: OtherUser) => {
            this.getPeerAndAdd(userDetails.address, userDetails)
            .then(peer => {
              this.addMessage(
                peer,
                peer.alias,
                message.message,
                message.timestamp
              );
              peer.hasUnreadMessages = true;
              this.gotMessagesFromDatabase = true;
            });
          })
        );
      }
    });

    Promise.all(promiseList)
    .then(() => {
      // start a listener that ears for messages
      this.websocketSubscription = this.wsService.websocketSubject
      .subscribe(message => {
        const receivedMessage = JSON.parse(message);
        const content = JSON.parse(receivedMessage['message']);
        const method = content['method'];
        if (method === 'message') { // message received!
          const sender = receivedMessage['sender'];
          // answer the reception
          this.wsService.sendMessageAnswer(sender, content['id']);

          this.getPeerAndAdd(sender)
          .then(peer => {
            this.addMessage(
              peer,
              peer.alias,
              content['params']['message'],
              parseInt(content['params']['timestamp'], 10)
            );
            peer.hasUnreadMessages = true;
          });
        }
      });
    });
  }

  checkOnlineStatus(): void {
    for (const peer of this.connectedPeers) {
      const onlinePeer = this.firebaseService.whosOnlineList.find(x =>
        x.address === peer.address
      );
      if (onlinePeer) {
        peer['isOnline'] = true;
      } else {
        peer['isOnline'] = false;
      }
    }
  }

  addMessage(peer: Peer, user: string, message: string, timestamp: number) {
    peer.messageHistory.push({
      user: user,
      message: message,
      timestamp: timestamp
    });
  }

  sendMessage(message: string) {
    const messageReceiver = this.selectedPeer.address.toLowerCase();
    const currentTime = Date.now();
    const messageId =
      this.wsService.sendMessage(messageReceiver, message, currentTime);
    this.sendingMessage = true;
    // check if peer is online: does a automated respond come back?
    let gotReponse = false;
    const websocketAnswerSubscription = this.wsService.websocketSubject
    .subscribe(answer => {
      const receivedMessage = JSON.parse(answer);
      const content = JSON.parse(receivedMessage['message']);
      const method = content['method'];
      const answerId = content['id'];
      if (method === 'messageAnswer' && answerId === messageId) {
        gotReponse = true;
        this.sendingMessage = false;
        this.addMessage(
          this.selectedPeer,
          'You',
          message,
          currentTime
        );
      }
    });

    // what if nobody answers? :-( put it to firebase!
    setTimeout(() => {
      if (!gotReponse) {
        if (this.connectionService.web3Connected && this.connectionService.wsConnected) {
          this.addMessage(this.selectedPeer, 'System', 'Peer is offline.', currentTime);

          this.firebaseService.getUserDetailsFromAddress(messageReceiver)
          .then(userDetails => {
            if (userDetails && userDetails.uid) {
              // connect to firebase and check my account
              this.askToStore(message)
              .then(response => {
                if (response) {
                  if (this.connectionService.connected) {
                    this.firebaseService.storeMessageInFireBase(
                      userDetails.uid, message
                    ).then(fbResponse => {
                      this.addMessage(this.selectedPeer,
                        fbResponse.user, fbResponse.message, fbResponse.timestamp);
                    });
                  }
                }
              });
            } else {
              this.addMessage(this.selectedPeer, 'System',
                'Can not find peer in database.', currentTime);
            }
          });
        } else {
          console.log('You are offline.');
        }
      }
      this.sendingMessage = false;
      websocketAnswerSubscription.unsubscribe();
    }, 3000);
  }

  askToStore(message: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const dialogRef = this.dialog.open(DialogSendOfflineComponent, {
        width: '400px',
        data: message
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) { resolve(result); } else { resolve(false); }
      });
    });
  }

  addPeer(address: string, userDetails?: OtherUser): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const addressLC = address.toLowerCase();
      if (!this.isAddressInPeerList(addressLC)) {
        if (userDetails) {
          this.connectedPeers.push({
            address: addressLC,
            messageHistory: [],
            hasUnreadMessages: false,
            isOnline: false,
            alias: userDetails.alias,
            uid: userDetails.uid
          });
          if (this.connectedPeers.length === 1) {
            this.selectedPeer = this.connectedPeers[0];
          }
          resolve(true);
        } else {
          resolve(
            this.firebaseService.getUserDetailsFromAddress(addressLC)
            .then(dbUserDetails => {
              let alias: string;
              let uid: string;
              if (dbUserDetails) {
                alias = dbUserDetails.alias;
                uid = dbUserDetails.uid;
              } else {
                alias = addressLC.slice(2, 6);
                uid = null;
              }
              this.connectedPeers.push({
                address: addressLC,
                messageHistory: [],
                hasUnreadMessages: false,
                isOnline: false,
                alias: alias,
                uid: uid
              });
              if (this.connectedPeers.length === 1) {
                this.selectedPeer = this.connectedPeers[0];
              }
              return true;
            })
          );
        }
      } else {
        resolve(false);
      }
    });
  }

  getPeerFromAddress(address: string): Peer {
    return this.connectedPeers.find((peer) => {
      return peer.address === address;
    });
  }

  getPeerAndAdd(address: string, userDetails?: OtherUser): Promise<Peer> {
    return this.addPeer(address, userDetails)
    .then(added => {
      return Promise.resolve(this.getPeerFromAddress(address.toLowerCase()));
    });
  }

  isAddressInPeerList(address: string): boolean {
    return (this.getPeerFromAddress(address) !== undefined);
  }
}
