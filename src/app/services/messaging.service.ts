import { Injectable } from '@angular/core';

import { ConnectWeb3Service } from './connectWeb3.service';
import { WebsocketService } from './websocket.service';
import { FirebaseService } from './firebase.service';

import { Message, Peer } from '../types/types';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  
  public connectedPeers: Peer[] = [];
  public selectedPeer: Peer;

  private websocketSubscription: any;
  private websocketAnswerSubscription: any;

  constructor(    
    private web3service: ConnectWeb3Service,
    private wsService: WebsocketService,
    private firebaseService: FirebaseService
  ) { }

  get unreadMessages(): number {
    let nUnread = 0;
    for(let peer of this.connectedPeers) {
      if(peer.hasUnreadMessages) nUnread += 1;
    }
    return nUnread;
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
          message.user,
          message.message,
          message.timestamp
        )
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
          sender,
          content['params']['message'],
          parseInt(content['params']['timestamp'])
        )
        peer.hasUnreadMessages = true;
      }
    })
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
    let currentTime = Date.now();
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
        console.log('Peer is offline.')
        // connect to firebase and check my account
        // this.askToStore()
        // .then(response => {
        //   if(response) 
        //     let response = this.storeMessageInFireBase(this.web3service.connectedAccount.toLowerCase(),
        //       messageReceiver, messageText, currentTime)
                // let peer = this.messageService.getPeerAndAdd(messageReceiver)
                // this.messageService.addMessage(
                //   peer,
                  
                // )
        // })
      }
      this.websocketAnswerSubscription.unsubscribe();
    }, 3000)
  }
  
  addPeer(address: string): void {
    if(!this.isAddressInPeerList(address)) {
      this.connectedPeers.push({
        address: address.toLowerCase(),
        messageHistory: [],
        hasUnreadMessages: false
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
