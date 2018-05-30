import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subject, Subscription } from 'rxjs/Rx';
import { WebsocketService } from '../services/websocket.service';
import { Erc20Service } from '../services/erc20.service';
import { AirswapdexService } from '../services/airswapdex.service';

import { EthereumTokensSN, getTokenByName, getTokenByAddress } from '../services/tokens';

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

  public selectedRole: string = 'taker';
  public inputToken: string = '';
  public displayCustomInput: boolean = false;

  public tokenList: any[] = EthereumTokensSN;
  public foundIntents: any[] = []
  public websocketSubscription: Subscription;

  public astBalance: number = 0;
  public balanceTooLow: boolean = true;
  constructor(
    private erc20service: Erc20Service,
    private airswapService: AirswapdexService,
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

  arraysEqual(_arr1, _arr2): boolean {
    if (!Array.isArray(_arr1) 
    || ! Array.isArray(_arr2) 
    || _arr1.length !== _arr2.length)
      return false;

    var arr1 = _arr1.concat().sort((x, y) => {
      if(x.makerToken > y.makerToken) return -1;
      if(x.makerToken < y.makerToken) return 1;
      if(x.takerToken > y.takerToken) return -1;
      if(x.takerToken < y.takerToken) return 1;
      return 0;
    });
    var arr2 = _arr2.concat().sort((x, y) => {
      if(x.makerToken > y.makerToken) return -1;
      if(x.makerToken < y.makerToken) return 1;
      if(x.takerToken > y.takerToken) return -1;
      if(x.takerToken < y.takerToken) return 1;
      return 0;
    });

    for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i])
          return false;
    }
    return true;
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
        "address": this.web3service.connectedAccount.toLowerCase(),
        "makerToken": this.makerToken,
        "takerToken": this.takerToken,
        "role": "maker"
      }
      if(!this.isIntentInList(intent)) {
        this.myIntents.push(intent);
        this.callSetIntents();
      }
    }
  }

  callGetTokenByAddress(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).symbol
    else
      return null
  }

  callSetIntents(): void {
    let newIntentList = JSON.parse(JSON.stringify(this.myIntents));
    for(let intent of this.intentsMarkedForRemoval) {
      let idx = this.findIdxOfIntent(intent, newIntentList)
      if(idx >= 0)
      newIntentList.splice( idx, 1 );
    }
    this.markedIntents = false;
    let uuid = this.wsService.setIntents(newIntentList)

    this.websocketSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      let parsedMessage = JSON.parse(message);
      let parsedContent = JSON.parse(parsedMessage['message']);
      let id = parsedContent['id'];
      if(id === uuid){
        let response = parsedContent['result'];
        if(response === 'ok') {
          this.getMyIntents();
        }
        this.websocketSubscription.unsubscribe();
      }
    })
  }
}
