import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { WebsocketService } from '../services/websocket.service';

import { Subject, Subscription, Observable } from 'rxjs/Rx';
import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';

type Message = {
  user: string;
  message: string;
  timestamp: number;
}

@Component({
  selector: 'app-message-system',
  templateUrl: './message-system.component.html',
  styleUrls: ['./message-system.component.css']
})
export class MessageSystemComponent implements OnInit, OnDestroy {

  private websocketSubscription: any;
  private websocketAnswerSubscription: any;
  public isOpen: boolean = true;

  private myConnectedAccount: string;
  public receiver: string = '';
  public message: string = '';

  public messageList: Message[] = [];

  constructor(
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    private db: AngularFireDatabase) { }

  ngOnInit() {
    this.myConnectedAccount = this.web3service.connectedAccount.toLowerCase();
    let observableMyUnreceivedMessages =
      this.db.object(this.myConnectedAccount)
      .valueChanges()
      .subscribe(entries => {
        if(entries){
          if(entries['unreceivedMessage']) {
            for(let msg in entries['unreceivedMessage']) {
              this.displayMessageOnScreen(
                'From ' + entries['unreceivedMessage'][msg]['sender'],
                entries['unreceivedMessage'][msg]['message'],
                msg)
            }
            this.db.object(this.myConnectedAccount+'/unreceivedMessage').remove();
          }
        }
        observableMyUnreceivedMessages.unsubscribe();
      })
    this.startMessenger();
  }

  ngOnDestroy() {
    if(this.websocketSubscription) this.websocketSubscription.unsubscribe;
    if(this.websocketAnswerSubscription) this.websocketAnswerSubscription.unsubscribe;
  }

  startMessenger(): void {
    // start a listener that looks for messages
    this.websocketSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      let receivedMessage = JSON.parse(message);
      let content = JSON.parse(receivedMessage['message'])
      let method = content['method']
      if (method === 'message'){
        //message received!
        //answer the reception
        this.wsService.sendMessageAnswer(receivedMessage['sender'], content['id'])
        
        this.displayMessageOnScreen(
          receivedMessage['sender'],
          content['params']['message'],
          content['params']['timestamp']
        )
      }
    })
    this.isOpen = true;
  }
  
  displayMessageOnScreen(user, message, timestamp): void {
    this.messageList.unshift({
      user: user,
      message: message,
      timestamp: timestamp
    })
  }
  
  sendMessage(): void {
    //check receiver address
    if (this.receiver.length === 42 || this.message.length > 0) {
      let messageReceiver = this.receiver.toLowerCase();
      let messageText = this.message;
      let currentTime = Date.now();
      let messageId = this.wsService.sendMessage(
        messageReceiver, messageText, currentTime
      )
      let gotReponse: boolean = false;

      this.websocketAnswerSubscription = this.wsService.websocketSubject
      .subscribe(message => {
        let receivedMessage = JSON.parse(message);
        let content = JSON.parse(receivedMessage['message'])
        let method = content['method']
        let answerId = content['id']
        if (method === 'messageAnswer' && answerId === messageId){
          gotReponse = true;
          this.displayMessageOnScreen(
            'You to '+messageReceiver.slice(0,6),
            messageText,
            currentTime)
        }
      })

      // what if nobody answers? :-( put it to firebase!
      setTimeout(()=> {
        if(!gotReponse) {
          // connect to firebase and check my account
          this.askToStore()
          .then(response => {
            if(response) 
              this.storeMessageInFireBase(this.myConnectedAccount,
                messageReceiver, messageText, currentTime)
          })
        }
        this.websocketAnswerSubscription.unsubscribe();
      }, 3000)
    }
  }
  askToStore(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (confirm(
        'Receiver seems to be offline.'+
        'Shall the message be (currently unencrypted) stored '+
        'and be send when he logs in?')) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  storeMessageInFireBase(messageSender, messageReceiver, 
    message, currentTime): void {
    
    let dbMyAccount: AngularFireObject<any>; 
    let obsNumberOfSendMessages: Subscription;
    
    dbMyAccount = this.db.object(messageSender);
    obsNumberOfSendMessages = dbMyAccount.valueChanges()
    .subscribe(entries => {
      let sendMessages = 0;
      let lastSentMessageTime = currentTime;
      let allowedToPost = true;

      if(entries) {// do I have sent messages to firebase before?
        if (entries['sendMessages'])
          sendMessages = entries['sendMessages']

        if (entries['lastSentMessageTime']) {
          if (currentTime - entries['lastSentMessageTime'] < 60000) {
            // I am spamming mailboxes
            this.displayMessageOnScreen(
              '',
              'He is offline. Can only send message every 60 seconds.',
              currentTime
            )
            allowedToPost = false;
          }
        }
      }
      if(allowedToPost) {
        dbMyAccount.update({
          'sendMessages': sendMessages+1,
          'lastSentMessageTime': currentTime
        })
        let receiverRef: AngularFireObject<any> = 
          this.db.object(messageReceiver+'/unreceivedMessage');
        receiverRef.update({
          [currentTime]: {
            sender: messageSender,
            message: message
          }
        });
        this.displayMessageOnScreen(
          'You to '+messageReceiver.slice(0,6),
          message+'\n('+messageReceiver.slice(0,6)+' is offline.'+
            'He will get the message when he signs in.)',
          currentTime
        )

      }
      obsNumberOfSendMessages.unsubscribe();
    })
  }
}
