import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { auth, User } from 'firebase/app';

import { Erc20Service } from './erc20.service';
import { ConnectionService } from './connection.service';
import { WebsocketService } from './websocket.service';
import { Message, StoredMessage, Peer, LoggedInUser, OtherUser, Token } from '../types/types';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public user: User;

  public observerWhosOnline: any;
  public whosOnlineList: OtherUser[] = [];
  public numWhosOnline = 0;

  constructor(
    private db: AngularFireDatabase,
    private connectionService: ConnectionService,
    private erc20Service: Erc20Service,
    private afAuth: AngularFireAuth,
  ) { }

  registerUser(): void {
    const user = this.connectionService.loggedInUser;
    this.db.object('registeredAddresses/' + user.address)
    .set({
      'uid': user.uid
    });
  }


  pingMe(): void {
    const user = this.connectionService.loggedInUser;
    this.db.object('users/' + user.uid)
    .set({
      'alias': user.alias,
      'address': user.address,
      'loggedIn': Date.now()
    });
  }

  logOffUser(): void {
    // this.db.object('users/' + this.connectionService.loggedInUser.uid)
    // .remove();
    this.connectionService.loggedInUser.uid = '';
    this.afAuth.auth.signOut();
  }

  deleteUser(): void {
    const uid = this.connectionService.loggedInUser.uid;
    const address = this.connectionService.loggedInUser.address;
    this.db.object('registeredAddresses/' + address).remove();
    this.db.object('messaging/' + uid).remove();
    this.db.object('users/' + uid).remove();
    this.afAuth.auth.currentUser.delete();
  }

  updateName(newName: string): void {
    this.connectionService.loggedInUser.alias = newName;
    this.afAuth.auth.currentUser.updateProfile({
      displayName: newName,
      photoURL: null
    });
    this.db.object('users/' + this.connectionService.loggedInUser.uid)
    .update({
      address: this.connectionService.loggedInUser.address,
      alias: newName,
      loggedIn: Date.now(),
    });
  }

  initReadWhosOnline(): void {
    this.observerWhosOnline =
    this.db.object('users')
    .valueChanges()
    .subscribe(entries => {
      if (entries) {
        const currentTime = Date.now();

        this.whosOnlineList = [];
        for (const entry in entries) {
          if (entries[entry]) {
            if (currentTime - entries[entry].loggedIn < 64000) {
              const user: OtherUser = {
                address: entries[entry].address,
                alias: entries[entry].alias,
                uid: entry
              };
              this.whosOnlineList.push(user);
            }
          }
        }
        this.numWhosOnline = this.whosOnlineList.length;
      }
    });
  }

  stopReadWhosOnline() {
    if (this.observerWhosOnline) {
      this.observerWhosOnline.unsubscribe();
    }
  }

  getUserDetails(uid: string): Promise<OtherUser> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object('users/' + uid)
      .valueChanges()
      .subscribe(userDetails => {
        subscription.unsubscribe();
        let user: OtherUser;
        if (userDetails) {
          user = {
            address: userDetails['address'],
            alias: userDetails['alias'],
            uid: uid
          };
        }
        resolve(user);
      });
    });
  }

  getUserDetailsFromAddress(address: string): Promise<OtherUser> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object('registeredAddresses/' + address.toLowerCase())
      .valueChanges()
      .subscribe(user => {
        subscription.unsubscribe();
        if (user && user['uid']) {
          resolve(this.getUserDetails(user['uid']));
        } else {
          resolve(null);
        }
      });
    });
  }

  getUnreceivedMessages(): Promise<StoredMessage[]> {
    const unreceivedMessages: StoredMessage[] = [];
    const rawMessages: any[] = [];
    return new Promise((resolve, reject) => {
      const observableMyUnreceivedMessages =
      this.db.object('messaging/' + this.connectionService.loggedInUser.uid)
      .valueChanges()
      .subscribe(entries => {
        if (entries && entries['unreceivedMessage']) {
          for (const timestamp in entries['unreceivedMessage']) {
            if (entries['unreceivedMessage'][timestamp]) {
              const uid = entries['unreceivedMessage'][timestamp].sender;
              const message = entries['unreceivedMessage'][timestamp].message;
              unreceivedMessages.push({
                uid: uid,
                message: message,
                timestamp: parseInt(timestamp, 10)
              });
            }
          }
        }
        observableMyUnreceivedMessages.unsubscribe();
        resolve(unreceivedMessages);
      });
    });
  }

  removeUnreceivedMessages(peerUid: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let numberOfMessages = 0;
      let numberOfRemoved = 0;

      const observableMyUnreceivedMessages =
      this.db.object('messaging/' + this.connectionService.loggedInUser.uid +
                     '/unreceivedMessage')
      .valueChanges()
      .subscribe(entries => {
        if (entries) {
          for (const timestamp in entries) {
            if (entries[timestamp]) {
              numberOfMessages += 1;
              if (peerUid === entries[timestamp]['sender']) {
                this.db.object('messaging/' +
                    this.connectionService.loggedInUser.uid +
                    '/unreceivedMessage/' + timestamp).remove();
                numberOfRemoved += 1;
              }
            }
          }
        }
        observableMyUnreceivedMessages.unsubscribe();
        resolve(numberOfMessages - numberOfRemoved);
      });
    });
  }

  storeMessageInFireBase(messageReceiver: string ,
    message: string): Promise<Message> {

    let response: Message;

    let dbMyAccount: AngularFireObject<any>;
    let obsNumberOfSendMessages: Subscription;

    dbMyAccount = this.db.object('messaging/' +
                                this.connectionService.loggedInUser.uid);

    return new Promise((resolve, reject) => {
      obsNumberOfSendMessages = dbMyAccount.valueChanges()
      .subscribe(entries => {
        let sendMessages = 0;
        let allowedToPost = true;
        const currentTime = Date.now();

        if (entries) {// do I have sent messages to firebase before?
          if (entries['sendMessages']) {
            sendMessages = entries['sendMessages'];
          }

          if (entries['lastSentMessageTime']) {
            if (currentTime - entries['lastSentMessageTime'] < 60000) {
              // Spam protection. Message to firebase only allowed every 60s
              allowedToPost = false;
            }
          }
        }

        if (allowedToPost) {
          dbMyAccount.update({
            'sendMessages': sendMessages + 1,
            'lastSentMessageTime': currentTime
          });
          const receiverRef: AngularFireObject<any> =
            this.db.object('messaging/' + messageReceiver + '/unreceivedMessage');
          receiverRef.update({
            [currentTime]: {
              sender: this.connectionService.loggedInUser.uid,
              message: message
            }
          });

          response = {
            user: 'You',
            message: message + ' (Peer is offline.)',
            timestamp: currentTime
          };
        } else {
          response = {
            user: 'System',
            message:
              'SPAM PROTECTION: You can only send a message every 60s.',
            timestamp: currentTime
          };
        }
        obsNumberOfSendMessages.unsubscribe();
        resolve(response);
      });
    });
  }

  getTokenListFromDatabase(): Promise<Token[]> {
    let dbToken: AngularFireObject<any>;
    let obsToken: Subscription;
    dbToken = this.db.object('tokens');

    return new Promise((resolve, reject) => {
      obsToken = dbToken.valueChanges()
      .subscribe(entry => {
        const tokenList: Token[] = [];
        if (entry) {
          for (const token in entry) {
            if (entry[token]) {
              const newToken = {
                address: token,
                name: entry[token]['name'],
                symbol: entry[token]['symbol'],
                decimals: entry[token]['decimals']
              };
              tokenList.push(newToken);
            }
          }
        }
        obsToken.unsubscribe();
        resolve(tokenList);
      });
    });
  }

  getTokenFromDatabase(tokenAddress): Promise<Token> {
    let dbToken: AngularFireObject<any>;
    let obsToken: Subscription;
    dbToken = this.db.object('tokens/' + tokenAddress.toLowerCase());

    return new Promise((resolve, reject) => {
      obsToken = dbToken.valueChanges()
      .subscribe(entry => {
        let foundToken;
        if (entry) {
          foundToken = {
            address: entry,
            name: entry['name'],
            symbol: entry['symbol'],
            decimals: entry['decimals']
          };
        }
        obsToken.unsubscribe();
        resolve(entry);
      });
    });
  }

  addToken(tokenAddress, tokenName, tokenSymbol, tokenDecimals): Promise<boolean> {
    const contract = this.erc20Service.getContract(tokenAddress);
    let validToken = true;
    const promiseList = [];
    promiseList.push(
      this.erc20Service.name(contract)
      .then(name => validToken = validToken && tokenName === name)
      .catch(() => validToken = false)
    );
    promiseList.push(
      this.erc20Service.symbol(contract)
      .then(symbol => validToken = validToken && tokenSymbol === symbol)
      .catch(() => validToken = false)
    );
    promiseList.push(
        this.erc20Service.decimals(contract)
      .then(decimals => validToken = validToken && tokenDecimals === decimals)
      .catch(() => validToken = false)
    );

    return Promise.all(promiseList)
    .then(() => {
      if (validToken) {
        this.db.object('tokens/' + tokenAddress.toLowerCase())
        .update({
          'name': tokenName,
          'symbol': tokenSymbol,
          'decimals': tokenDecimals,
          'addedBy': this.connectionService.loggedInUser.uid
        });
        return true;
      } else {
        console.log('Did not add token to database. Error at checking.');
        return false;
      }
    });
  }
}
