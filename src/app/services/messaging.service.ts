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

  private wsListenMessagesSubscription: any;

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
          this.getPeerAndAdd(message.uid)
          .then((peer) => {
            this.addMessage(
              peer,
              peer.alias,
              message.message,
              message.timestamp
            );
            peer.hasUnreadMessages = true;
            this.gotMessagesFromDatabase = true;
          })
        );
      }
    });

    Promise.all(promiseList)
    .then(() => {
      // start a listener that ears for messages
      this.wsListenMessagesSubscription = this.wsService.websocketSubject
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

  checkOnlineStatusOfPeerList(): void {
    for (const peer of this.connectedPeers) {
      this.wsService.pingAndListenForPong(peer.address)
      .then(onlinePeer => {
        if (onlinePeer) {
          peer['isOnline'] = true;
        } else {
          peer['isOnline'] = false;
        }
      });
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
        if (!this.connectionService.connected) {
          this.addMessage(this.selectedPeer, 'System',
          'You are offline.', currentTime);
        } else {
          this.addMessage(this.selectedPeer, 'System',
          'Peer is offline.', currentTime);

          if (this.selectedPeer.uid) {
            this.askToStore(message) // check if user wants to send message
            .then(response => {
              if (response) {
                if (this.connectionService.connected) { // still connected?
                  this.firebaseService.storeMessage(
                    this.selectedPeer.uid, message
                  ).then(fbResponse => {
                    this.addMessage(this.selectedPeer,
                      fbResponse.user, fbResponse.message, fbResponse.timestamp);
                  });
                }
              }
            });
          } else {
            this.addMessage(this.selectedPeer, 'System',
            'Peer unknown to database.', currentTime);
          }
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

  addPeer(uid: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isUidInPeerList(uid)) {
        let address: string;
        let alias: string;
        resolve(
          this.firebaseService.getUserAddress(uid)
          .then(userAddress => {
            address = userAddress;
            return this.firebaseService.getUserAlias(uid);
          }).then(userAlias => {
            alias = userAlias;
            return this.firebaseService.getUserOnline(uid);
          }).then(isOnline => {
            this.connectedPeers.push({
              address: address,
              messageHistory: [],
              hasUnreadMessages: false,
              isOnline: isOnline,
              alias: alias,
              uid: uid
            });
            if (this.connectedPeers.length === 1) {
              this.selectedPeer = this.connectedPeers[0];
            }
            return true;
          })
        );
      } else {
        resolve(false);
      }
    });
  }

  addPeerByAddress(address: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const addressLC = address.toLowerCase();
      if (!this.isAddressInPeerList(addressLC)) {
        let uid: string;
        let alias: string;
        resolve(
          this.firebaseService.getUserUid(addressLC)
          .then(userUID => {
            uid = userUID;
            if (userUID) {
              return this.firebaseService.getUserAlias(uid);
            } else {
              return addressLC.slice(2, 6);
            }
          }).then(userAlias => {
            alias = userAlias;
            if (uid){
              return this.firebaseService.getUserOnline(uid);
            } else {
              return false;
            }
          }).then(isOnline => {
            this.connectedPeers.push({
              address: addressLC,
              messageHistory: [],
              hasUnreadMessages: false,
              isOnline: isOnline,
              alias: alias,
              uid: uid
            });
            if (this.connectedPeers.length === 1) {
              this.selectedPeer = this.connectedPeers[0];
            }
            return true;
          })
        );
      } else {
        resolve(false);
      }
    });
  }

  // connected peers from address
  getPeerAndAddByAddress(address: string): Promise<Peer> {
    return this.addPeerByAddress(address)
    .then(added => {
      return Promise.resolve(this.getConnectedPeerFromAddress(address));
    });
  }

  getConnectedPeerFromAddress(address: string): Peer {
    const addressLC = address.toLowerCase();
    return this.connectedPeers.find((peer) => {
      return peer.address === addressLC;
    });
  }

  isAddressInPeerList(address: string): boolean {
    return (this.getConnectedPeerFromAddress(address) !== undefined);
  }

  // connected peers from uid
  getPeerAndAdd(uid: string): Promise<Peer> {
    return this.addPeer(uid)
    .then(added => {
      return Promise.resolve(this.getConnectedPeerFromUid(uid));
    });
  }

  getConnectedPeerFromUid(uid: string): Peer {
    return this.connectedPeers.find((peer) => {
      return peer.uid === uid;
    });
  }

  isUidInPeerList(uid: string): boolean {
    return (this.getConnectedPeerFromAddress(uid) !== undefined);
  }

}
