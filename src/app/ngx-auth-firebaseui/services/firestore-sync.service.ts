import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { QueryFn } from 'angularfire2/firestore/interfaces';

export const collections = {
  users: 'users',
};

@Injectable()
export class FirestoreSyncService {

  constructor(public afs: AngularFirestore) {}


  public getUserDocRefByUID(uid: string): AngularFirestoreDocument<any> {
    return this.afs.doc(`${collections.users}/${uid}`);
  }


  public getUsersCollectionRef(queryFn?: QueryFn): AngularFirestoreCollection<any> {
    return this.afs.collection(`${collections.users}/`, queryFn);
  }

  public deleteUserData(uid: string): Promise<any> {
    const userRef: AngularFirestoreDocument<any> = this.getUserDocRefByUID(uid);
    return userRef.delete();
  }


  public updateUserData(user: any): Promise<any> {
    const userRef: AngularFirestoreDocument<any> = this.getUserDocRefByUID(user.uid);
    const data: any = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      providerId: user.providerId
    };
    return userRef.set(data, {merge: true});
  }
}
