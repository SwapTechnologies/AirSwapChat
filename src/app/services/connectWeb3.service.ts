import { Injectable } from '@angular/core';

import { ConnectionService } from './connection.service';

declare var require: any;
const Web3 = require('web3');

declare global {
  interface Window { web3: any; }
}
window.web3 = window.web3 || undefined;

@Injectable()
export class ConnectWeb3Service {

  private _web3: any;
  public desiredNetwork = 'Rinkeby';

  public connected = false;
  public correctNetwork = false;
  public accountConnected = false;

  public connected_to: string;
  public connected_to_network: string;
  public connectedAccount: string;
  constructor(
    private connectionService: ConnectionService,
  ) { }


  get web3(): any {
    if (!this._web3) {
      this.connectToNode();
    }
    return this._web3;
  }

  set web3(web3: any) {
    this._web3 = web3;
  }

  get connectionEstablished(): boolean {
    return (this.connected && this.correctNetwork && this.accountConnected);
  }

  checkConnection(): void {
    // check if connection to web3 is available via web3
    this.isConnected()
    .then(connected => {
      this.connected = connected;
      if (connected) { // generally a connection available?
        return this.getNetworkId();
      } else {
        return null;
      }
    })
    .then(network => {
      // is it connected to the correct network?
      this.correctNetwork = (network === this.desiredNetwork);
      return this.getAccount();
    }).then(account => {
      // is an account connected?
      this.accountConnected = account !== undefined;

      // check whether web3 account is the same as the websocket registered one
      if (this.accountConnected) {
        const accountLC = account.toLowerCase();
        this.connectionService.loggedInUser.address = accountLC;

        if (this.connectionService.loggedInUser.wsAddress
        && accountLC !== this.connectionService.loggedInUser.wsAddress) {
          this.connectionService.wsConnected = false;
        }
      }

      // log whether connection to web3 is established
      this.connectionService.web3Connected = this.connectionEstablished;
    }).catch((error) => {console.log('Error while checking connection.'); });
  }

  connectToNode(): void {
    const connectMetamask: () => void = () => {
      console.log('Connecting to Metamask.');
      this.web3 = new Web3(window.web3.currentProvider);
      this.connected_to = 'Metamask';
    };
    const connectLocalNode: () => void = () => {
      console.log('Connecting to localhost:8545');
      this.web3 = new Web3('http://localhost:8545');
      this.connected_to = 'local node';
    };

    console.log('Initializing Web3.');
    if (typeof this._web3 !== 'undefined') { // if already defined -> ok.
      console.log('Is already initialized. Reconnecting to current provider.');
      this.web3 = new Web3(this.web3.currentProvider);
    } else if (typeof window.web3 !== 'undefined') { // use injected web3 provider from browser
      connectMetamask();
    } else {
      connectLocalNode();
    }
    this.getNetworkId();
    console.log('This page is using web3 version:', this.web3.version);
  }

  getNetworkId(): Promise<string> {
    return this.web3.eth.net.getId().then(id => {
      if (id === 1) {
        this.connected_to_network = 'Mainnet';
      } else if (id === 3) {
        this.connected_to_network = 'Ropsten';
      } else if (id === 4) {
        this.connected_to_network = 'Rinkeby';
      } else if (id === 42) {
        this.connected_to_network = 'Kovan';
      } else {
        this.connected_to_network = 'Unknown';
      }
      return this.connected_to_network;
      });
  }

  isConnected(): Promise<boolean> {
    return this.web3.eth.net.isListening();
  }

  getAccount(): Promise<string> {
    return this.web3.eth.getAccounts().then(result => {
      this.connectedAccount = result[0];
      return this.connectedAccount;
    });
  }

  getBalance(account: string): Promise<number> {
    return this.web3.eth.getBalance(account).then(result => {
      return result;
    });
  }
}
