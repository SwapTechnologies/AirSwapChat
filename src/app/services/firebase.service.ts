import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

// firebase
import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { auth, User, database } from 'firebase/app';

// services
import { Erc20Service } from './erc20.service';
import { ConnectionService } from './connection.service';
import { WebsocketService } from './websocket.service';

// types
import { StoredMessage, OtherUser, Token } from '../types/types';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public observerWhosOnline: any;
  public userIsVerified = false;
  public numOfFirebaseReads = 0;

  public whosOnlineList = [];
  public lastTimeLoadedWhosOnline = 0;

  constructor(
    private db: AngularFireDatabase,
    private connectionService: ConnectionService,
    private erc20Service: Erc20Service,
    private afAuth: AngularFireAuth,
  ) { }


  checkMyUidAndAddressMatch(): Promise<any> {
    return this.getUserAddress(this.connectionService.loggedInUser.uid)
    .then(myAddress => {
      return {
        newAddress: myAddress === null,
        addressChanged: myAddress !== this.connectionService.loggedInUser.address,
        databaseAddress: myAddress
      };
    });
  }

  registerNewUser(): Promise<any> {
    return this.getObjectFromDatabase('registeredAddresses/' + this.connectionService.loggedInUser.address)
    .then((uid) => {
      if (uid) {
        return Promise.reject('Address is already registered with another account.');
      } else {
        return this.db.object('registeredAddresses/' + this.connectionService.loggedInUser.address)
        .set({ 'uid': this.connectionService.loggedInUser.uid });
      }
    })
    .then(() => this.setMyAliasAndAddress());
  }

  setMyAliasAndAddress(): Promise<any> {
    return this.db.object('users/' + this.connectionService.loggedInUser.uid)
    .set({
      'alias': this.connectionService.loggedInUser.alias,
      'address': this.connectionService.loggedInUser.address,
    });
  }

  setMeOnline(): Promise<any> {
    return this.db.object('online/' + this.connectionService.loggedInUser.uid)
    .set({ 'online': true })
    .then(() => {
      database().ref().child('online/' + this.connectionService.loggedInUser.uid)
      .onDisconnect()
      .remove();
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
      this.connectionService.firebaseConnected = false;
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
      this.logOffUser();
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

  getObjectFromDatabase(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object(path).valueChanges()
      .subscribe(result => {
        subscription.unsubscribe();
        this.numOfFirebaseReads += 1;
        resolve(result);
      });
    });
  }

  readWhosOnline(): Promise<any> {
    // const promiseList = [];
    this.lastTimeLoadedWhosOnline = Date.now();
    return this.getObjectFromDatabase('online');
  }

  getUserUid(address: string): Promise<any> {
    return this.getObjectFromDatabase('registeredAddresses/' + address.toLowerCase() + '/uid');
  }

  getUserAddress(uid: string): Promise<any> {
    return this.getObjectFromDatabase('users/' + uid + '/address');
  }

  getUserAlias(uid: string): Promise<any> {
    return this.getObjectFromDatabase('users/' + uid + '/alias');
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

  getUserOnlineSubscription(uid: string, callback: any): Subscription {
    return this.db.object('online/' + uid + '/online')
    .valueChanges()
    .subscribe(online => callback(online));
  }

  getUserOnline(uid: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const subscription = this.db.object('online/' + uid)
      .valueChanges()
      .subscribe(online => {
        console.log('check if user is online', online);
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
        // console.log('getting tokenlist', entry);
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

  /**
   * Check the firebase database whether token is already stored
   * @param tokenAddress Token you want to check
   */
  getTokenFromDatabase(tokenAddress): Promise<Token> {
    return this.getObjectFromDatabase('tokens/' + tokenAddress.toLowerCase());
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
