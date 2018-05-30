import { Injectable } from '@angular/core';

import { ConnectWeb3Service } from './connectWeb3.service';
import { WebsocketService } from './websocket.service';
import { WhosOnlineService } from './whos-online.service';
import { FirebaseService } from './firebase.service';

import { Message, Peer } from '../types/types';

import { MatDialog } from '@angular/material';
import { DialogSendOfflineComponent } from '../message-system/dialog-send-offline/dialog-send-offline.component';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  
  public connectedPeers: Peer[] = [];
  public selectedPeer: Peer;

  private websocketSubscription: any;
  private websocketAnswerSubscription: any;

  public showMessenger: boolean = false;
  public gotMessagesFromDatabase: boolean = false;

  
  constructor(    
    private web3service: ConnectWeb3Service,
    private wsService: WebsocketService,
    private whosOnlineService: WhosOnlineService,
    private firebaseService: FirebaseService,
    public dialog: MatDialog,
  ) { }

  get unreadMessages(): number {
    let nUnread = 0;
    for(let peer of this.connectedPeers) {
      if(peer.hasUnreadMessages) nUnread += 1;
    }
    return nUnread;
  }

  setMessageRead(): void {
    this.selectedPeer.hasUnreadMessages = false;
    if(this.gotMessagesFromDatabase) {
      this.firebaseService.removeUnreceivedMessages(this.web3service.connectedAccount, this.selectedPeer.address)
      .then(remainingMessages => {
        if(remainingMessages === 0) {
          this.gotMessagesFromDatabase = false;
        }
      })
    }

  }
  startMessenger(): void {
    console.log('Starting the messenger.');
    //check firebase for unread messages
    this.firebaseService.getUnreceivedMessages(this.web3service.connectedAccount)
    .then(unreceivedMessages => {
      for(let message of unreceivedMessages) {
        let peer = this.getPeerAndAdd(message.user);
        this.addMessage(
          peer,
          peer.alias,
          message.message,
          message.timestamp
        )
        peer.hasUnreadMessages = true;
        this.gotMessagesFromDatabase = true;
      }
    })


    // start a listener that ears for messages
    this.websocketSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      let receivedMessage = JSON.parse(message);
      let content = JSON.parse(receivedMessage['message'])
      let method = content['method']
      if (method === 'message'){ //message received!
        let sender = receivedMessage['sender'];
        //answer the reception
        this.wsService.sendMessageAnswer(sender, content['id'])
        
        let peer = this.getPeerAndAdd(sender);
        this.addMessage(
          peer,
          peer.alias,
          content['params']['message'],
          parseInt(content['params']['timestamp'])
        )
        peer.hasUnreadMessages = true;
      }
    })
  }

  checkOnlineStatus(): void {
    for(let peer of this.connectedPeers) {
      let onlinePeer = this.whosOnlineService.whosOnlineList.find(x =>
        x.address === peer.address
      )
      if(onlinePeer){
        peer['isOnline'] = true;
        peer['alias'] = onlinePeer['alias'];
      } else {
        peer['isOnline'] = false;
        peer['alias'] = peer.address.slice(2,6);
      }
    }
  }

  addMessage(peer: Peer, user: string, message: string, timestamp:number) {
    peer.messageHistory.push({
      user: user,
      message: message,
      timestamp: timestamp
    })
  }

  sendMessage(message: string) {
    let messageReceiver = this.selectedPeer.address.toLowerCase();
    let currentTime = Math.round(Date.now()/1000);
    let messageId = this.wsService.sendMessage(
      messageReceiver, message, currentTime)
    
    //check if peer is online: does a automated respond come back?
    let gotReponse: boolean = false;
    this.websocketAnswerSubscription = this.wsService.websocketSubject
    .subscribe(answer => {
      let receivedMessage = JSON.parse(answer);
      let content = JSON.parse(receivedMessage['message'])
      let method = content['method']
      let answerId = content['id']
      if (method === 'messageAnswer' && answerId === messageId){
        gotReponse = true;
        this.addMessage(
          this.selectedPeer,
          'You',
          message,
          currentTime
        );
      }
    })

    // what if nobody answers? :-( put it to firebase!
    setTimeout(()=> {
      if(!gotReponse) {
        this.addMessage(this.selectedPeer, 'System', 'Peer is offline.', currentTime);
        // connect to firebase and check my account
        this.askToStore(message)
        .then(response => {
          if(response) {
            this.firebaseService.storeMessageInFireBase(this.web3service.connectedAccount.toLowerCase(), messageReceiver, message, currentTime)
            .then(fbResponse => {
              this.addMessage(this.selectedPeer, fbResponse.user, fbResponse.message, fbResponse.timestamp);
            })
          }
        })
      }
      this.websocketAnswerSubscription.unsubscribe();
    }, 3000)
  }

  askToStore(message: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let dialogRef = this.dialog.open(DialogSendOfflineComponent, {
        width: '400px',
        data: message
      });

      dialogRef.afterClosed().subscribe(result => {
        if(result) resolve(result)
        else resolve(false);
      });
    });
  }

  addPeer(address: string): void {
    if(!this.isAddressInPeerList(address)) {
      this.connectedPeers.push({
        address: address.toLowerCase(),
        messageHistory: [],
        hasUnreadMessages: false,
        isOnline: false,
        alias: address.toLowerCase().slice(2,6),
      })
      if(this.connectedPeers.length === 1) {
        this.selectedPeer = this.connectedPeers[0]
      }
    } else {
      console.log('Address already added to list.');
    }
  }

  getPeerFromAddress(address: string): Peer {
    return this.connectedPeers.find((peer) => {
      return peer.address === address;
    })
  }

  getPeerAndAdd(address: string): Peer {
    if(!this.isAddressInPeerList(address))
      this.addPeer(address);
    return this.getPeerFromAddress(address);
  }

  isAddressInPeerList(address: string): boolean {
    return (this.getPeerFromAddress(address) !== undefined);
  }
}
