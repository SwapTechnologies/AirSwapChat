import { Injectable } from '@angular/core';
import { Subject, Subscription, Observable } from 'rxjs/Rx';

import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';

import { Message, Peer, LoggedInUser } from '../types/types';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private db: AngularFireDatabase,
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

  removeUnreceivedMessages(account: string, peerAddress: string): Promise<number> {
    let accountLC: string = account.toLowerCase();
    let peerAddressLC: string = peerAddress.toLowerCase();
    
    return new Promise((resolve, reject) => {
      let numberOfMessages: number = 0;
      let numberOfRemoved: number = 0;
      
      let observableMyUnreceivedMessages =
      this.db.object(accountLC+'/unreceivedMessage')
      .valueChanges()
      .subscribe(entries => {
        if(entries) {
          for(let msg in entries) {
            numberOfMessages += 1
            if(peerAddress === entries[msg]['sender']) {
              this.db.object(accountLC+'/unreceivedMessage/'+msg).remove();
              numberOfRemoved += 1
            }
          } 
        }
        observableMyUnreceivedMessages.unsubscribe();
        resolve(numberOfMessages - numberOfRemoved);
      })
    })
  }

  storeMessageInFireBase(messageSender:string , messageReceiver:string , 
    message:string , currentTime: number): Promise<Message> {
    
    let response: Message;
    
    let dbMyAccount: AngularFireObject<any>; 
    let obsNumberOfSendMessages: Subscription;

    dbMyAccount = this.db.object(messageSender.toLowerCase());
    return new Promise((resolve, reject) => {
      obsNumberOfSendMessages = dbMyAccount.valueChanges()
      .subscribe(entries => {
        let sendMessages = 0;
        let lastSentMessageTime = currentTime;
        let allowedToPost = true;
  
        if(entries) {// do I have sent messages to firebase before?
          if (entries['sendMessages'])
            sendMessages = entries['sendMessages']
  
          if (entries['lastSentMessageTime']) {
            if (currentTime - entries['lastSentMessageTime'] < 60) {
              //Spam protection. Message to firebase only allowed every 60s
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
  
          response = {
            user: 'You',
            message: message+' (Peer is offline.)',
            timestamp: currentTime
          }
        } else {
          response = {
            user: 'System',
            message:
              'SPAM PROTECTION: You can only send a message every 60s.',
            timestamp: currentTime
          }
        }
        obsNumberOfSendMessages.unsubscribe();
        resolve(response);
      })
    })
  }
}
