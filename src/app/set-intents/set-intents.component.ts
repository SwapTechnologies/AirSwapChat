import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subject, Subscription } from 'rxjs/Rx';
import { WebsocketService } from '../services/websocket.service';
import { Erc20Service } from '../services/erc20.service';
import { AirswapdexService } from '../services/airswapdex.service';

import { EthereumTokensSN, getTokenByName, getTokenByAddress, EtherAddress } from '../services/tokens';

@Component({
  selector: 'app-set-intents',
  templateUrl: './set-intents.component.html',
  styleUrls: ['./set-intents.component.scss']
})
export class SetIntentsComponent implements OnInit, OnDestroy {

  public makerToken: string;
  public takerToken: string;

  public myIntents: any[] = [];
  public markedIntents: boolean = false;
  public intentsMarkedForRemoval: any;

  public tokenList: any[] = EthereumTokensSN;
  public unapprovedTokens: any[] = [];
  public websocketSubscription: Subscription;

  public astBalance: number = 0;
  public balanceTooLow: boolean = true;

  public clickedApprove: any = {};
  public errorMessage: string = '';

  constructor(
    private erc20service: Erc20Service,
    private airswapDexService: AirswapdexService,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    private ref: ChangeDetectorRef) { }

  ngOnInit() {
    let astContract = this.erc20service.getContract(getTokenByName("AirSwap").address);
    this.erc20service.balance(astContract, this.web3service.connectedAccount)
    .then(balance => {
      this.astBalance = balance/1e4;
      this.balanceTooLow = this.astBalance < 250;
    })

    this.getMyIntents();
  }

  getMyIntents():void {
    let uuid = this.wsService.getIntents(this.web3service.connectedAccount.toLowerCase());
    let answerSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      let parsedMessage = JSON.parse(message);
      let parsedContent = JSON.parse(parsedMessage['message']);
      let id = parsedContent['id'];
      if(id === uuid){
        this.myIntents = parsedContent['result'];
        this.intentsMarkedForRemoval = [];
        this.checkApproval();
        answerSubscription.unsubscribe();
      }
    })
  }

  findIdxOfIntent(intent, intentList): number {
    return intentList.findIndex(x => {
      return (x.makerToken === intent.makerToken
           && x.takerToken === intent.takerToken)
    })
  }

  isIntentInList(intent): any {
    return this.myIntents.find(x => {
      return (x.makerToken === intent.makerToken
           && x.takerToken === intent.takerToken)
    })
  }

  changedList(event): void {
    this.markedIntents = event.length>0
  }
  
  ngOnDestroy() {
    if(this.websocketSubscription) this.websocketSubscription.unsubscribe;
  }
  
  addTokenPair(): void {
    if(this.makerToken 
    && this.takerToken 
    && this.makerToken 
    !== this.takerToken) {
      let intent = {
        "makerToken": this.makerToken.toLowerCase(),
        "takerToken": this.takerToken.toLowerCase(),
        "role": "maker"
      }
      if(!this.isIntentInList(intent)) {
        this.myIntents.push(intent);
        this.callSetIntents(this.myIntents);
      }
    }
  }

  callGetTokenByAddress(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).symbol
    else
      return null
  }

  removeMarkedIntents(): void {
    let newIntentList = JSON.parse(JSON.stringify(this.myIntents));
    // removed marked intents
    for(let intent of this.intentsMarkedForRemoval) {
      let idx = this.findIdxOfIntent(intent, newIntentList)
      if(idx >= 0)
      newIntentList.splice( idx, 1 );
    }
    this.markedIntents = false;

    this.callSetIntents(newIntentList);
  }

  callSetIntents(intentList): void {
    let sendIntents = [];
    for(let intent of intentList) {
      sendIntents.push({
        makerToken: intent.makerToken,
        takerToken: intent.takerToken,
        role: intent.role,
      })
    }
    let uuid = this.wsService.setIntents(sendIntents)
    this.websocketSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      let parsedMessage = JSON.parse(message);
      let parsedContent = JSON.parse(parsedMessage['message']);
      let id = parsedContent['id'];
      if(id === uuid){
        let response = parsedContent['result'];
        if(response === 'ok') {
          this.getMyIntents();
        } else {
          if(parsedContent['error']){
            this.myIntents.splice(-1,1);
            this.errorMessage = parsedContent['error']['message'];
          }
        }
        this.websocketSubscription.unsubscribe();
      }
    })
  }

  checkApproval(): void {
    let promiseList = [];
    console.log('checking approval of ', this.myIntents);
    for(let intent of this.myIntents) {
      let contract = this.erc20service.getContract(intent.makerToken);
      this.clickedApprove[intent.makerToken] = false;
      promiseList.push(
        this.erc20service.approvedAmount(contract,  this.airswapDexService.airswapDexAddress)
        .then(approvedAmount => {
          if(!(approvedAmount > 0) && !this.unapprovedTokens.find(x => {return x===intent.makerToken}) )
            this.unapprovedTokens.push(intent.makerToken)
        })
      )
    }
  }
  approveMaker(makerToken: string): void {
    this.clickedApprove[makerToken] = true;
    let contract = this.erc20service.getContract(makerToken);
    this.erc20service.approve(contract, this.airswapDexService.airswapDexAddress)
    .then(result => {
      this.checkApproval();
    })
    .catch(error => {
      console.log("Approve failed.");
      this.clickedApprove[makerToken] = false;
    })
  }

  filterEther(token: any) {
    return token.address !== EtherAddress
  }

}
