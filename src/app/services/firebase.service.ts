import { Injectable } from '@angular/core';
import { Subject, Subscription, Observable } from 'rxjs/Rx';

import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';

import { Message, Peer, LoggedInUser } from '../types/types';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private db: AngularFireDatabase
  ) { }

  addUserOnline(user: LoggedInUser): void {
    let dbUserObject: AngularFireObject<any>; 
    dbUserObject = this.db.object('loggedInAccounts/'+user.address.toLowerCase());
    dbUserObject.update({
      'alias': user.alias,
      'loggedIn': Math.round(Date.now()/1000)
    })
  }

  pingUser(user: LoggedInUser): void {
    let dbUserObject: AngularFireObject<any>; 
    dbUserObject = this.db.object('loggedInAccounts/'+user.address.toLowerCase());
    dbUserObject.update({
      'alias': user.alias,
      'loggedIn': Math.round(Date.now()/1000)
    })
  }

  logOffUser(user: LoggedInUser): void {
    this.db.object('loggedInAccounts/'+user.address.toLowerCase()).remove();
  }

  readWhoIsOnline(): Promise<LoggedInUser[]> {
    let whosOnlineList: LoggedInUser[] = [];
    let currentTime = Math.round(Date.now()/1000);

    return new Promise((resolve, reject) => {
      let observableWhosOnline =
      this.db.object('loggedInAccounts')
      .valueChanges()
      .subscribe(entries => {
        if(entries) {
          for(let entry in entries) {
            let user: LoggedInUser = {
              address: entry,
              alias: entries[entry].alias,
            } 
            if(currentTime - entries[entry].loggedIn < 60) {
              whosOnlineList.push(user);
            } else {
              this.logOffUser(user)
            }
          }
          observableWhosOnline.unsubscribe();
          resolve(whosOnlineList)
        }
      })
    })
  }

  getUnreceivedMessages(account: string): Promise<Message[]> {
    let accountLC: string = account.toLowerCase()
    let unreceivedMessages: Message[] = [];
    return new Promise((resolve, reject) => {
      let observableMyUnreceivedMessages =
      this.db.object(accountLC)
      .valueChanges()
      .subscribe(entries => {
        if(entries && entries['unreceivedMessage']) {
          for(let msg in entries['unreceivedMessage']) {
            let sender = entries['unreceivedMessage'][msg]['sender'];
            unreceivedMessages.push({
              user: sender,
              message: entries['unreceivedMessage'][msg]['message'],
              timestamp: parseInt(msg)
            })
          } 
        }
        observableMyUnreceivedMessages.unsubscribe();
        resolve(unreceivedMessages);
      })
    })
  }

  removeUnreceivedMessages(account: string): void {
    let accountLC: string = account.toLowerCase()
    this.db.object(accountLC+'/unreceivedMessage').remove();
  }

  storeMessageInFireBase(messageSender:string , messageReceiver:string , 
    message:string , currentTime: number): Message {
    
    let response: Message
    
    let dbMyAccount: AngularFireObject<any>; 
    let obsNumberOfSendMessages: Subscription;

    dbMyAccount = this.db.object(messageSender.toLowerCase());
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
            console.log('Spam protection. Message to firebase only allowed every 60s');
            allowedToPost = false;
            // this.displayMessageOnScreen(
            //   '',
            //   'He is offline. Can only send message every 60 seconds.',
            //   currentTime
            // )
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

        response = {
          user: 'You',
          message: message+'\n('+messageReceiver.slice(0,8)+' is offline.'+
            'He will get the message when he signs in.)',
          timestamp: currentTime
        }
      }
      obsNumberOfSendMessages.unsubscribe();
    })
    return response;
  }
}
