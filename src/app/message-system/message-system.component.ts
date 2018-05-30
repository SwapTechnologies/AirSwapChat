import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription, Observable } from 'rxjs/Rx';
import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';

//services
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { MessagingService } from '../services/messaging.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog } from '@angular/material';
import { DialogAddPeerComponent } from './dialog-add-peer/dialog-add-peer.component';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

import { Message, Peer } from '../types/types';

@Component({
  selector: 'app-message-system',
  templateUrl: './message-system.component.html',
  styleUrls: ['./message-system.component.scss']
})
export class MessageSystemComponent implements OnInit, OnDestroy {

  public message: string = ''; // text entered in message box

  public timer: any;

  constructor(
    private web3service: ConnectWeb3Service,
    public messageService: MessagingService,
    private firebaseService: FirebaseService,
    public wsService: WebsocketService,
    private zone: NgZone,
    private db: AngularFireDatabase,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.timer = TimerObservable.create(0, 5000)
    .subscribe( () => this.updateStatus());
  }

  ngOnDestroy() {
    if(this.timer)
      this.timer.unsubscribe();
  }

  updateStatus(): void {
    if(this.messageService.selectedPeer)
      this.messageService.selectedPeer.hasUnreadMessages = false;
    
    this.messageService.checkOnlineStatus();
  }

  openDialogAddPeer() {
    let dialogRef = this.dialog.open(DialogAddPeerComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if(this.web3service.web3.utils.isAddress(result))
        this.messageService.addPeer(result);      
      else
        console.log('Entered invalid address.');
    });
  }
  
  sendMessage(): void {
    if (this.message.length > 0) {
      this.messageService.sendMessage(this.message);
      this.message = '';
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


  displayMessageOnScreen(user, message, timestamp): void {
    // this.selectedPeer.messageHistory.unshift({
    //   user: user,
    //   message: message,
    //   timestamp: timestamp,
    //   seen: true
    // })
  }

  storeMessageInFireBase(messageSender, messageReceiver, 
    message, currentTime): void {
    
    // let dbMyAccount: AngularFireObject<any>; 
    // let obsNumberOfSendMessages: Subscription;
    
    // dbMyAccount = this.db.object(messageSender);
    // obsNumberOfSendMessages = dbMyAccount.valueChanges()
    // .subscribe(entries => {
    //   let sendMessages = 0;
    //   let lastSentMessageTime = currentTime;
    //   let allowedToPost = true;

    //   if(entries) {// do I have sent messages to firebase before?
    //     if (entries['sendMessages'])
    //       sendMessages = entries['sendMessages']

    //     if (entries['lastSentMessageTime']) {
    //       if (currentTime - entries['lastSentMessageTime'] < 60000) {
    //         // I am spamming mailboxes
    //         this.displayMessageOnScreen(
    //           '',
    //           'He is offline. Can only send message every 60 seconds.',
    //           currentTime
    //         )
    //         allowedToPost = false;
    //       }
    //     }
    //   }
    //   if(allowedToPost) {
    //     dbMyAccount.update({
    //       'sendMessages': sendMessages+1,
    //       'lastSentMessageTime': currentTime
    //     })
    //     let receiverRef: AngularFireObject<any> = 
    //       this.db.object(messageReceiver+'/unreceivedMessage');
    //     receiverRef.update({
    //       [currentTime]: {
    //         sender: messageSender,
    //         message: message
    //       }
    //     });
    //     this.displayMessageOnScreen(
    //       'You to '+messageReceiver.slice(0,6),
    //       message+'\n('+messageReceiver.slice(0,6)+' is offline.'+
    //         'He will get the message when he signs in.)',
    //       currentTime
    //     )

    //   }
    //   obsNumberOfSendMessages.unsubscribe();
    // })
  }
}
