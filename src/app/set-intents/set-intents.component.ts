import { Component, OnInit, OnDestroy } from '@angular/core';
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
  public intents: any[] = [];

  public selectedRole: string = 'taker';
  public inputToken: string = '';
  public displayCustomInput: boolean = false;

  public tokenList: any[] = EthereumTokensSN;
  public foundIntents: any[] = []
  public websocketSubscription: Subscription;

  public astBalance: number = 0;
  constructor(
    private erc20service: Erc20Service,
    private airswapService: AirswapdexService,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService  ) { }

  ngOnInit() {
    let astContract = this.erc20service.getContract(getTokenByName("AirSwap").address);
    this.erc20service.balance(astContract, this.web3service.connectedAccount)
    .then(balance => {
      this.astBalance = balance/1e4;
    })

    this.getMyIntents();
  }

  ngOnDestroy() {
    if(this.websocketSubscription) this.websocketSubscription.unsubscribe;
  }
  
  addTokenPair(): void {
    if(this.makerToken && this.takerToken && this.makerToken !== this.takerToken) {
      let intent = {
        "makerToken": this.makerToken,
        "takerToken": this.takerToken,
        "role": "maker"
      }
      this.intents.push(intent);
    }
  }

  callGetTokenByAddress(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).symbol
    else
      return null
  }

  callSetIntents(): void {
    if(this.intents.length > 0) {
      let uuid = this.wsService.setIntents(this.intents)

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

  getMyIntents():void {
    let uuid = this.wsService.getIntents(this.web3service.connectedAccount.toLowerCase());
    let answerSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      let parsedMessage = JSON.parse(message);
      let parsedContent = JSON.parse(parsedMessage['message']);
      let id = parsedContent['id'];
      
      if(id === uuid){
        this.myIntents = parsedContent['result'];
        answerSubscription.unsubscribe();
      }
    })
  }
}
