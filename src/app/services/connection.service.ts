import { Injectable } from '@angular/core';

import { LoggedInUser } from '../types/types';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  public loggedInUser: LoggedInUser = {
    alias: null,
    address: null,
    wsAddress: null,
    uid: null
  };
  public web3Connected = false;
  public wsConnected = false;
  public firebaseConnected = false;
  public anonymousConnection = false;
  constructor() { }

  get connected(): boolean {
    return this.web3Connected
           && this.wsConnected
           && (this.firebaseConnected || this.anonymousConnection);
  }

}
