import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';


// firebase
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { auth, User, database } from 'firebase/app';
import { UserInfo } from 'firebase/app';

// services
import { Erc20Service } from './erc20.service';
import { ConnectionService } from './connection.service';
import { NotificationService} from '../services/notification.service';

// types
import { StoredMessage, Token } from '../types/types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public observerWhosOnline: any;
  public userIsVerified = false;
  public numOfFirebaseReads = 0;

  public whosOnlineList = [];
  public lastTimeLoadedWhosOnline = 0;

  public firestoreUserData: any;

  constructor(
    private db: AngularFireDatabase,
    private connectionService: ConnectionService,
    private erc20Service: Erc20Service,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private notifierService: NotificationService,
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

  setConsent(): Promise<any> {
    return this.afs.collection('users')
    .doc(this.connectionService.loggedInUser.uid).update({
      'consentToSAndStorage': true
    });
  }

  isConsent(): Promise<any> {
    return this.getObjectFromFirestore('users', 'consentToSAndStorage');
  }

  setWantsEmailNotification(wantsEmailNotification: boolean): Promise<any> {
    return this.afs.collection('users')
    .doc(this.connectionService.loggedInUser.uid).update({
      'wantMessageNotification': wantsEmailNotification
    }).then(() => {
      this.firestoreUserData.wantMessageNotification = wantsEmailNotification;
    });
  }

  getUserInfoFromFirestore(): Promise<any> {
    return this.getObjectFromFirestore('users', this.connectionService.loggedInUser.uid)
    .then(result => {
      this.firestoreUserData = result;
    }).catch(error => {
      console.log(error, 'Could not query user.');
    });
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

  setUidOnline(uid: string): Promise<any> {
    return this.db.object('online/' + uid)
    .set({ 'online': true });
  }

  setUidOffline(uid: string): Promise<any> {
    return this.db.object('online/' + uid)
    .remove();
  }

  addPeerAsFriend(uid: string): Promise<any> {
    return this.db.object('users/' + this.connectionService.loggedInUser.uid + '/peers/')
    .update({[uid]: true});
  }

  removePeerAsFriend(uid: string): Promise<any> {
    return this.db.object(
      'users/' + this.connectionService.loggedInUser.uid + '/peers/' + uid).remove();
  }

  logOffUser(): Promise<any> {
    return this.db.object('online/' + this.connectionService.loggedInUser.uid)
    .remove()
    .then(() => this.afAuth.auth.signOut())
    .then(() => {
      this.userIsVerified = false;
      this.connectionService.loggedInUser.uid = null;
      this.connectionService.firebaseConnected = false;
      this.firestoreUserData = null;
    });
  }

  get user(): User {
    return this.afAuth.auth.currentUser;
  }

  deleteUser(credentials): Promise<any> {
    const uid = this.connectionService.loggedInUser.uid;
    const address = this.connectionService.loggedInUser.address;

    return this.user.reauthenticateAndRetrieveDataWithCredential(credentials)
    .then(fulfilled => {
      return this.afs.collection('users').doc(uid).delete();
    }).then(() => {
      return this.afAuth.auth.currentUser.delete();
    }).then(() => {
      this.db.object('registeredAddresses/' + address).remove();
      this.db.object('messaging/' + uid).remove();
      this.db.object('users/' + uid).remove();
      console.log('Deleted ', uid);
      this.logOffUser();
    }).catch ((error) => {
      if (error.code && error.code === 'auth/wrong-password') {
        this.notifierService.showMessage('Invalid Password.');
      } else {
        console.log('Unexpected error while delete user\'s account', error);
      }
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

  getObjectFromFirestore(collection: string, doc: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.afs.collection(collection).doc(doc).valueChanges()
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
        subscription.unsubscribe();
        if (online) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  getMyPeers(): Promise<any> {
    return this.getObjectFromDatabase('users/' + this.connectionService.loggedInUser.uid +
    '/peers');
  }

  deletePeerFromList(uid: string): Promise<any> {
    return this.db.object(
      'users/' +
      this.connectionService.loggedInUser.uid +
      '/peers/' + uid).remove();
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
    return new Promise((resolve, reject) => {
      const obsToken = this.afs.collection(environment.ethereumNetwork.tokenDB).valueChanges()
      .subscribe(entry => {
        obsToken.unsubscribe();
        const tokenList: Token[] = [];
        if (entry) {
          for (const token in entry) {
            if (entry[token]) {
              const newToken = {
                address: entry[token]['address'],
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
    return this.getObjectFromFirestore(environment.ethereumNetwork.tokenDB, tokenAddress.toLowerCase());
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
    promiseList.push(
      this.erc20Service.approvedAmountAirSwap(contract)
      .then(approvedAmount => validToken = validToken && Number(approvedAmount) >= 0)
      .catch(() => validToken = false)
    );

    return Promise.all(promiseList)
    .then(() => {
      if (validToken) {
        this.afs.collection(environment.ethereumNetwork.tokenDB).doc(tokenAddress.toLowerCase())
        .set({
          'address': tokenAddress.toLowerCase(),
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
