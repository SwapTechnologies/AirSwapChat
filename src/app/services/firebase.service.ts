import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { auth, User, database } from 'firebase/app';

import { Erc20Service } from './erc20.service';
import { ConnectionService } from './connection.service';
import { WebsocketService } from './websocket.service';
import { Message, StoredMessage, Peer, LoggedInUser, OtherUser, Token } from '../types/types';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public observerWhosOnline: any;
  public whosOnlineList: OtherUser[] = [];
  public lastTimeLoadedUserList = 0;
  public userIsVerified = false;

  constructor(
    private db: AngularFireDatabase,
    private connectionService: ConnectionService,
    private erc20Service: Erc20Service,
    private afAuth: AngularFireAuth,
  ) { }

  registerUser(): Promise<any> {
    const user = this.connectionService.loggedInUser;
    return this.db.object('registeredAddresses/' + user.address)
    .set({ 'uid': user.uid })
    .then(() => this.db.object('online/' + user.uid)
    .set({ 'online': true }))
    .then(() => {
      database().ref().child('online/' + user.uid)
      .onDisconnect()
      .remove();

      return this.db.object('users/' + user.uid)
      .set({
        'alias': user.alias,
        'address': user.address,
      });
    });
  }

  addPeerAsFriend(uid: string): Promise<any> {
    return this.db.object('users/' + this.connectionService.loggedInUser.uid + '/peers/')
    .update({[uid]: true});
  }

  logOffUser(): Promise<any> {
    return this.db.object('online/' + this.connectionService.loggedInUser.uid)
    .remove()
    .then(() => this.afAuth.auth.signOut())
    .then(() => {
      this.userIsVerified = false;
      this.connectionService.loggedInUser.uid = '';
    });
  }

  get user(): User {
    return this.afAuth.auth.currentUser;
  }

  deleteUser(): Promise<any> {
    return this.afAuth.auth.currentUser.delete()
    .then(() => {
      const uid = this.connectionService.loggedInUser.uid;
      const address = this.connectionService.loggedInUser.address;
      this.db.object('registeredAddresses/' + address).remove();
      this.db.object('messaging/' + uid).remove();
      this.db.object('users/' + uid).remove();
    });
  }

  updateName(newName: string): void {
    this.connectionService.loggedInUser.alias = newName;
    this.afAuth.auth.currentUser.updateProfile({
      displayName: newName,
      photoURL: null
    });
    this.db.object('users/' + this.connectionService.loggedInUser.uid)
    .update({alias: newName});
  }

  readUserList(): Promise<any> {
    const promiseList = [];
    return new Promise((resolve, reject) => {
      this.lastTimeLoadedUserList = Date.now();
      const subscriptionWhosOnline = this.db.object('online')
      .valueChanges()
      .subscribe(entries => {
        subscriptionWhosOnline.unsubscribe();
        this.whosOnlineList = [];
        if (!entries) {
          resolve();
        } else {
          for (const uid in entries) {
            if (entries[uid]) {
              let alias;
              let address;
              promiseList.push(
                this.getUserAlias(uid)
                .then((userAlias) => {
                  alias = userAlias;
                  return this.getUserAddress(uid);
                }).then((userAddress) => {
                  address = userAddress;
                  const user: OtherUser = {
                    address: address,
                    alias: alias,
                    uid: uid
                  };
                  this.whosOnlineList.push(user);
                })
              );
            }
          }
          Promise.all(promiseList)
          .then(() => {
            this.whosOnlineList = this.whosOnlineList.filter(x => {
              return x.uid !== this.connectionService.loggedInUser.uid;
            });
            resolve();
          });
        }
      });
    });
  }

  getUserUid(address: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object('registeredAddresses/' + address.toLowerCase())
      .valueChanges()
      .subscribe(user => {
        subscription.unsubscribe();
        if (user && user['uid']) {
          resolve(user['uid']);
        }
        resolve(null);
      });
    });
  }

  getUserAddress(uid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object('users/' + uid + '/address')
      .valueChanges()
      .subscribe(address => {
        subscription.unsubscribe();
        if (address) {
          resolve(address);
        } else {
          resolve(null);
        }
      });
    });
  }

  getUserAlias(uid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object('users/' + uid + '/alias')
      .valueChanges()
      .subscribe(alias => {
        subscription.unsubscribe();
        if (alias) {
          resolve(alias);
        } else {
          resolve(null);
        }
      });
    });
  }

  getUserAliasFromAddress(address: string): Promise<any> {
    const addressLC = address.toLowerCase();
    return this.getUserUid(addressLC)
    .then(uid => {
      if (uid) {
        return this.getUserAlias(uid);
      } else {
        return addressLC.slice(2, 6);
      }
    });
  }

  getUserOnline(uid: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object('online/' + uid)
      .valueChanges()
      .subscribe(online => {
        subscription.unsubscribe();
        if (online) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }


  // getUserDetailsFromAddress(address: string): Promise<OtherUser> {
  //   return new Promise((resolve, reject) => {
  //     const subscription = this.db.object('registeredAddresses/' + address.toLowerCase())
  //     .valueChanges()
  //     .subscribe(user => {
  //       subscription.unsubscribe();
  //       if (user && user['uid']) {
  //         resolve(this.getUserDetails(user['uid']));
  //       } else {
  //         resolve(null);
  //       }
  //     });
  //   });
  // }

  getUnreceivedMessages(): Promise<StoredMessage[]> {
    const unreceivedMessages: StoredMessage[] = [];
    const rawMessages: any[] = [];
    return new Promise((resolve, reject) => {
      const observableMyUnreceivedMessages =
      this.db.object('messaging/' + this.connectionService.loggedInUser.uid)
      .valueChanges()
      .subscribe(entries => {
        observableMyUnreceivedMessages.unsubscribe();
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
        observableMyUnreceivedMessages.unsubscribe();
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
        resolve(numberOfMessages - numberOfRemoved);
      });
    });
  }

  storeMessage(messageReceiver: string, message: string): Promise<any> {
    const currentTime = Date.now();
    return this.db.object('messaging/' + messageReceiver + '/unreceivedMessage')
    .update({
      [currentTime]: {
        sender: this.connectionService.loggedInUser.uid,
        message: message
      }
    });
  }

  getTokenListFromDatabase(): Promise<Token[]> {
    let dbToken: AngularFireObject<any>;
    let obsToken: Subscription;
    dbToken = this.db.object('tokens');

    return new Promise((resolve, reject) => {
      obsToken = dbToken.valueChanges()
      .subscribe(entry => {
        obsToken.unsubscribe();
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
        obsToken.unsubscribe();
        let foundToken;
        if (entry) {
          foundToken = {
            address: entry,
            name: entry['name'],
            symbol: entry['symbol'],
            decimals: entry['decimals']
          };
        }
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
