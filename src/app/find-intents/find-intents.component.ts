import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subject, Subscription } from 'rxjs/Rx';

import { Erc20Service } from '../services/erc20.service';
import { WebsocketService } from '../services/websocket.service';

import { EthereumTokensSN, getTokenByName, getTokenByAddress } from '../services/tokens';

@Component({
  selector: 'app-find-intents',
  templateUrl: './find-intents.component.html',
  styleUrls: ['./find-intents.component.scss']
})
export class FindIntentsComponent implements OnInit, OnDestroy {

  public tokenList: any[] = EthereumTokensSN;
  public websocketSubscription: Subscription;

  public makerTokens: string[] = [];
  public takerTokens: string[] = [];

  public selectedToken: any;
  public selectedRole: string = 'maker';

  public foundIntents: any[] = []
  
  constructor(
    private erc20services: Erc20Service,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if(this.websocketSubscription) this.websocketSubscription.unsubscribe;
  }

  addToken(): void {
    if(this.selectedToken && this.selectedRole) {
      if (this.selectedRole === 'maker')
        this.makerTokens.push(this.selectedToken.address)
      else if (this.selectedRole === 'taker')
        this.takerTokens.push(this.selectedToken.address)
    }
  }

  callGetTokenByAddress(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token)
    else
      return null
  }

  callGetTokenNameByAddress(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).name
    else
      return null
  }

  callGetTokenSymbolByAddress(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).symbol
    else
      return null
  }

  callGetTokenDecimalsByAddress(token: string): number {
    if(getTokenByAddress(token))
      return 10**getTokenByAddress(token).decimals
    else
      return null
  }

  showIntents():void {
    this.makerTokens = [];
    this.takerTokens = [];
    this.addToken();

    if(this.makerTokens.length > 0 || this.takerTokens.length >0) {
      let uuid = this.wsService.findIntents(this.makerTokens, this.takerTokens)
      this.websocketSubscription = this.wsService.websocketSubject
      .subscribe(message => {
        let parsedMessage = JSON.parse(message);
        let parsedContent = JSON.parse(parsedMessage['message']);
        let id = parsedContent['id'];
        if(id === uuid){
          this.foundIntents = parsedContent['result'];
          this.makerTokens = [];
          this.takerTokens = [];
          this.websocketSubscription.unsubscribe();

          this.fetchBalances();
        }
      })
    }
  }

  fetchBalances(): void {
    let myContractAddress: string = this.selectedToken.address;
    let myContract: any = this.erc20services.getContract(myContractAddress);

    let peerAddress: string;
    let peerRole: string;
    let peerContractAddress: string;
    let peerContract: any;

    let promiseList: Array<any> = [];
    if(this.selectedRole === 'maker') 
      peerRole = 'takerToken';
    else if (this.selectedRole === 'taker') 
      peerRole = 'makerToken';
    for(let intent of this.foundIntents) {
      peerAddress = intent['address'];
      peerContractAddress = intent[peerRole];
      peerContract = this.erc20services.getContract(peerContractAddress);

      let peerBalanceMyToken: number;
      let peerBalancePeerToken: number;
      

      promiseList.push(
        this.erc20services.balance(myContract, peerAddress)
        .then(balance => {
          intent['peerBalanceMyToken'] = balance;
        })
      );
      promiseList.push(
        this.erc20services.balance(peerContract, peerAddress)
        .then(balance => {
          intent['peerBalanceHisToken'] = balance;
        })
      );
    }
    Promise.all(promiseList)
    .then(() => console.log(this.foundIntents));
  }
}
