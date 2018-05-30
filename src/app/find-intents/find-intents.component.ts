import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subject, Subscription } from 'rxjs/Rx';

import { AirswapdexService } from '../services/airswapdex.service';
import { Erc20Service } from '../services/erc20.service';
import { MessagingService } from '../services/messaging.service';
import { GetOrderService } from '../services/get-order.service';
import { WhosOnlineService } from '../services/whos-online.service';
import { WebsocketService } from '../services/websocket.service';

import { EthereumTokensSN, getTokenByName, getTokenByAddress } from '../services/tokens';

import { MatDialog } from '@angular/material';
import { DialogGetOrderComponent } from './dialog-get-order/dialog-get-order.component';
import { Lexer } from '@angular/compiler';

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

  public clickedApprove: any = {};
  
  public stillLoading: boolean = false;
  constructor(
    private airswapDexService: AirswapdexService,
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
        this.makerTokens.push(this.selectedToken.address.toLowerCase())
      else if (this.selectedRole === 'taker')
        this.takerTokens.push(this.selectedToken.address.toLowerCase())
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
          this.stillLoading = true;
          this.makerTokens = [];
          this.takerTokens = [];
          this.websocketSubscription.unsubscribe();
          
          this.fetchBalances();
          this.checkOnlineStatus();
        }
      })
    }
  }

  getExponential(exponent: number): number {
    return 10**exponent;
  }

  fetchBalances(): void {
    for(let intent of this.foundIntents) {
      let peerAddress = intent['address'];
      let makerToken = intent['makerToken'];
      let takerToken = intent['takerToken'];
      
      intent['makerProps'] = getTokenByAddress(makerToken);
      intent['takerProps'] = getTokenByAddress(takerToken);
      let makerContract = this.erc20services.getContract(makerToken);
      let takerContract = this.erc20services.getContract(takerToken);
      
      this.checkApproval(takerToken)
      .then(approvedAmount => {
        intent['approvedTakerToken'] = approvedAmount;
        this.clickedApprove[intent['takerToken']] = false;
      });

      this.erc20services.balance(makerContract, peerAddress)
      .then(balance => {
        intent['peerBalanceMakerToken'] = balance ;
      })
      .catch(error => 
        console.log('Error fetching the balance of ' + peerAddress + ' for contract ' + makerToken))
      
      this.erc20services.balance(takerContract, peerAddress)
      .then(balance => {
        intent['peerBalanceTakerToken'] = balance;
      })
      .catch(error => 
        console.log('Error fetching the balance of ' + peerAddress + ' for contract ' + takerToken))
    }
  }

  checkApproval(address: string): Promise<any> {
    let contract = this.erc20services.getContract(address);
    return this.erc20services.approvedAmount(contract,  this.airswapDexService.airswapDexAddress)
  }

  stringIsValidNumber(x: string): boolean {
    return Number(x) > 0;
  }

  approveTaker(intent: any): void {
    this.clickedApprove[intent['takerToken']] = true;
    let contract = this.erc20services.getContract(intent.takerToken);
    this.erc20services.approve(contract, this.airswapDexService.airswapDexAddress)
    .then(result => {
      console.log('approve')
      this.fetchBalances();
    })
    .catch(error => {
      console.log("Approve failed.");
      this.clickedApprove[intent['takerToken']] = false;
    })
  }

  checkOnlineStatus(): void {
    let PromiseList = [];
    let subscriptions = [];

    for(let intent of this.foundIntents) {
      intent['isOnline'] = false;
      intent['alias'] = intent.address.slice(2,6);
      PromiseList.push(
        new Promise((resolve, reject) => {
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
                if(method === 'pong') {
                  intent['isOnline'] = true;
                  let loggedInPeer = this.whosOnlineService.whosOnlineList
                  .find(x => x.address === intent.address);
                  if(loggedInPeer) {
                    intent['alias'] = loggedInPeer.alias;
                  }
                  resolve(true);
                }
              }
            })
          );
        })
      )
    }
    let delayPromise = new Promise((resolve, reject) => {
      setTimeout(()=> {
        resolve(false);
      }, 2000);
    })

    Promise.race([Promise.all(PromiseList), delayPromise])
    .then((onlineStatus) => {
      for (let subscription of subscriptions)
        subscription.unsubscribe();
      this.foundIntents =this.foundIntents.sort((a:any,b:any) => {
        return (a.isOnline === b.isOnline)? 0 : a.isOnline? -1 : 1;
      });
      this.stillLoading = false;
    })
    .catch(error => {
      console.log('Failed retrieving online status of peers');
    })
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
