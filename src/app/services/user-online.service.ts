import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class UserOnlineService {

  public myAccount: any;
  public users = {};
  public usersByAddress = {};

  public unregisteredUsersByAddress = {};

  constructor(
    private firebaseService: FirebaseService,
  ) { }

  addUser(uid: string, address: string, alias: string): void {
    if (!this.isUserListed(uid)) {
      const newUser = {
        alias: alias,
        address: address,
        uid: uid
      };
      this.users[uid] = newUser;
      this.usersByAddress[address] = newUser;

      const userOnlineSubscription =
      this.firebaseService.getUserOnlineSubscription(uid, (online) => {
        if (online) {
          this.setUserProperty(uid, 'online', true);
        } else {
          this.setUserProperty(uid, 'online', false);
        }
      });
      this.setUserProperty(uid, 'onlineSubscription', userOnlineSubscription);
    }
  }

  addUnregisteredUser(address: string, alias: string) {
    if (this.unregisteredUsersByAddress[address] === undefined) {
      this.unregisteredUsersByAddress[address] = {
        alias: alias,
        address: address
      };
    }
  }

  isUserListed(uid: string): boolean {
    return this.users[uid] !== undefined;
  }

  isUserListedByAddress(address: string): boolean {
    return (this.usersByAddress[address] !== undefined)
        || (this.unregisteredUsersByAddress[address] !== undefined);
  }

  addUserFromFirebase(uid: string): Promise<any> {
    if (this.isUserListed(uid)) {
      return Promise.resolve(this.users[uid]);
    } else {
      let address;
      let alias;
      return this.firebaseService.getUserAddress(uid)
      .then(fbAddress => {
        address = fbAddress;
        if (address) {
          return this.firebaseService.getUserAlias(uid);
        } else {
          return false;
        }
      }).then(fbAlias => {
        alias = fbAlias;
        if (alias) {
          this.addUser(uid, address, alias);
          return this.users[uid];
        } else {
          console.log('Tried to add a non-existing uid: ', uid);
          return null;
        }
      });
    }
  }

  /**
   * Add user to map of users by their address
   * @param address address of user to be added in lowercase
   * returns whether user is in firebase database or not
   */
  addUserFromFirebaseByAddress(address: string): Promise<any> {
    if (this.isUserListedByAddress(address)) {
      return Promise.resolve(this.getUserByAddress(address));
    } else {
      let uid;
      let alias;
      return this.firebaseService.getUserUid(address)
      .then(fbUid => {
        uid = fbUid;
        if (uid) {
          return this.firebaseService.getUserAlias(uid);
        } else {
          return false;
        }
      }).then(fbAlias => {
        alias = fbAlias;
        if (alias) {
          this.addUser(uid, address, alias);
          return this.usersByAddress[address];
        } else {
          this.addUnregisteredUser(address, address.slice(2, 6));
          return this.unregisteredUsersByAddress[address];
        }
      });
    }
  }

  setUserProperty(uid: string, propertyName: string, propertyValue: any) {
    this.users[uid][propertyName] = propertyValue;
    this.usersByAddress[this.users[uid].address][propertyName] = propertyValue;
  }

  setUserPropertyByAddress(address: string, propertyName: string, propertyValue: any) {
    this.usersByAddress[address][propertyName] = propertyValue;
    this.users[this.usersByAddress[address].uid][propertyName] = propertyValue;
  }

  getUserByAddress(address: string): any {
    let user = this.usersByAddress[address];
    if (user) {
      return user;
    } else {
      user = this.unregisteredUsersByAddress[address];
      if (user) {
        return user;
      } else {
        return null;
      }
    }
  }

}
