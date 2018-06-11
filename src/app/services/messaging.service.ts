import { Injectable } from '@angular/core';

// services
import { ConnectWeb3Service } from './connectWeb3.service';
import { ConnectionService } from './connection.service';
import { FirebaseService } from './firebase.service';
import { UserOnlineService } from './user-online.service';
import { WebsocketService } from './websocket.service';

import { Message, StoredMessage, OtherUser } from '../types/types';

import { MatDialog } from '@angular/material';
import { DialogSendOfflineComponent } from '../message-system/dialog-send-offline/dialog-send-offline.component';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  public connectedPeers: any[] = [];
  public selectedPeer: any;

  private wsListenMessagesSubscription: any;

  public showMessenger = false;
  public gotMessagesFromDatabase = false;
  public sendingMessage = false;


  constructor(
    private web3service: ConnectWeb3Service,
    private wsService: WebsocketService,
    private connectionService: ConnectionService,
    private firebaseService: FirebaseService,
    private userOnlineService: UserOnlineService,
    public dialog: MatDialog,
  ) { }

  get unreadMessages(): number {
    let nUnread = 0;
    for (const peer of this.connectedPeers) {
      if (peer.hasUnreadMessages) { nUnread += 1; }
    }
    return nUnread;
  }

  addPeer(uid: string): Promise<boolean> {
    if (this.isUidInPeerList(uid)) {
      return Promise.resolve(false);
    } else {
      return this.userOnlineService.addUserFromFirebase(uid)
      .then(peerDetails => {
        this.connectedPeers.push({
          peerDetails: peerDetails,
          messageHistory: [],
          hasUnreadMessages: false,
        });
        if (this.connectedPeers.length === 1) {
          this.selectedPeer = this.connectedPeers[0];
        }
        return true;
      });
    }
  }

  addPeerByAddress(address: string): Promise<boolean> {
    console.log('running addPeerByAddress for address', address);
    const addressLC = address.toLowerCase();
    if (this.isAddressInPeerList(addressLC)) {
      return Promise.resolve(false);
    } else {
      console.log(addressLC, ' not in Peer List. Adding data from Firebase');
      return this.userOnlineService.addUserFromFirebaseByAddress(addressLC)
      .then(peerDetails => {
        console.log('peerDetails:', peerDetails);
        this.connectedPeers.push({
          peerDetails: peerDetails,
          messageHistory: [],
          hasUnreadMessages: false,
        });
        if (this.connectedPeers.length === 1) {
          this.selectedPeer = this.connectedPeers[0];
        }
        return true;
      });
    }
  }

  isUidInPeerList(uid: string): boolean {
    return (this.getConnectedPeer(uid) !== undefined);
  }

  isAddressInPeerList(address: string): boolean {
    return (this.getConnectedPeerFromAddress(address) !== undefined);
  }

  getConnectedPeer(uid: string): any {
    return this.connectedPeers.find((peer) => {
      return peer.peerDetails.uid === uid;
    });
  }

  getConnectedPeerFromAddress(address: string): any {
    const addressLC = address.toLowerCase();
    return this.connectedPeers.find((peer) => {
      return peer.peerDetails.address === addressLC;
    });
  }

  // connected peers from uid
  getPeerAndAdd(uid: string): Promise<any> {
    console.log('trying to add peer with uid', uid)
    return this.addPeer(uid)
    .then(added => {
      console.log('added:', added);
      console.log(this.getConnectedPeer(uid));
      return Promise.resolve(this.getConnectedPeer(uid));
    });
  }

  // connected peers from address
  getPeerAndAddByAddress(address: string): Promise<any> {
    console.log('running getPeerAndAddByAddress for address', address);
    console.log('calling addPeerByAddress');
    return this.addPeerByAddress(address)
    .then(added => {
      console.log('fine');
      return Promise.resolve(this.getConnectedPeerFromAddress(address));
    });
  }

  setMessageRead(): void {
    this.selectedPeer.hasUnreadMessages = false;
    if (this.gotMessagesFromDatabase) {
      if (this.selectedPeer.peerDetails.uid) {
        this.firebaseService.removeUnreceivedMessages(this.selectedPeer.peerDetails.uid)
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
          console.log('RECEIVED MESSAGE: receivedMessage, content, sender:', receivedMessage, content, sender);
          this.wsService.sendMessageAnswer(sender, content['id']);
          this.getPeerAndAddByAddress(sender)
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

  addMessage(peer: any, user: string, message: string, timestamp: number) {
    peer.messageHistory.push({
      user: user,
      message: message,
      timestamp: timestamp
    });
  }

  sendMessage(message: string) {
    const messageReceiver = this.selectedPeer.peerDetails.address.toLowerCase();
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

          if (this.selectedPeer.peerDetails.uid) {
            this.askToStore(message) // check if user wants to send message
            .then(response => {
              if (response) {
                if (this.connectionService.connected) { // still connected?
                  this.firebaseService.storeMessage(
                    this.selectedPeer.peerDetails.uid, message
                  ).then(fbResponse => {
                    this.addMessage(this.selectedPeer,
                      'You', 'Offline Message: ' + message, currentTime);
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
}
