import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subject, Subscription } from 'rxjs/Rx';

import { Erc20Service } from '../services/erc20.service';
import { MessagingService } from '../services/messaging.service';
import { GetOrderService } from '../services/get-order.service';
import { WhosOnlineService } from '../services/whos-online.service';
import { WebsocketService } from '../services/websocket.service';

import { EthereumTokensSN, getTokenByName, getTokenByAddress } from '../services/tokens';

import { MatDialog } from '@angular/material';
import { DialogGetOrderComponent } from './dialog-get-order/dialog-get-order.component';

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
    private messageService: MessagingService,
    public getOrderService: GetOrderService,
    private web3service: ConnectWeb3Service,
    private whosOnlineService: WhosOnlineService,
    public wsService: WebsocketService,
    public dialog: MatDialog  ) { }

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
          this.checkOnlineStatus();
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
    // Promise.all(promiseList)
    // .then(() => console.log(this.foundIntents));
  }

  checkOnlineStatus(): void {
    let subscriptions = [];
    for(let intent of this.foundIntents) {
      intent['isOnline'] = false;
      intent['alias'] = intent.address.slice(2,6);
      let peerAddress = intent['address'];
      let uuid = this.wsService.pingPeer(peerAddress);

      subscriptions.push(
        this.wsService.websocketSubject
        .subscribe(message => {
          let parsedMessage = JSON.parse(message);
          let parsedContent = JSON.parse(parsedMessage['message']);
          let id = parsedContent['id'];
          if(id === uuid){
            let method = parsedContent['method']
            if(method === 'pong')
            intent['isOnline'] = true;

            let loggedInPeer = this.whosOnlineService.whosOnlineList
            .find(x => x.address === intent.address);
            if(loggedInPeer) {
              intent['alias'] = loggedInPeer.alias;
            }
          }
        })
      );
    }
    setTimeout(()=> {
      for (let subscription of subscriptions)
        subscription.unsubscribe();
    }, 3000);
  }

  message(intent: any): void {
    let peer = this.messageService.getPeerAndAdd(intent.address);
    this.messageService.selectedPeer = peer;
    this.messageService.showMessenger = true;
  }

  openDialogGetOrder(intent: any): void {
    let dialogRef = this.dialog.open(DialogGetOrderComponent, {
      width: '500px',
      data: intent
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result)
        intent['sentRequest'] = result;
    })
  }

}
