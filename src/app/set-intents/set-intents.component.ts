import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subject, Subscription } from 'rxjs/Rx';
import { WebsocketService } from '../services/websocket.service';

import { EthereumTokensSN, getTokenByName, getTokenByAddress } from '../services/tokens';

@Component({
  selector: 'app-set-intents',
  templateUrl: './set-intents.component.html',
  styleUrls: ['./set-intents.component.css']
})
export class SetIntentsComponent implements OnInit, OnDestroy {

  public makerToken: string;
  public takerToken: string;
  public intents: any[] = [];

  public selectedRole: string = 'taker';
  public inputToken: string = '';
  public displayCustomInput: boolean = false;

  public tokenList: any[] = EthereumTokensSN;
  public foundIntents: any[] = []
  public websocketSubscription: Subscription;

  constructor(
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if(this.websocketSubscription) this.websocketSubscription.unsubscribe;
  }
  
  addTokenPair(): void {
    if(this.makerToken && this.takerToken) {
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
            console.log('Intents are set')
          }
          this.websocketSubscription.unsubscribe();
        }
      })
    } 
  }

  // showIntents():void {
  //   this.addToken();
  //   if(this.makerTokens.length > 0 || this.takerTokens.length >0) {
  //     let uuid = this.wsService.findIntents(this.makerTokens, this.takerTokens)
  
  //     this.websocketSubscription = this.wsService.websocketSubject
  //     .subscribe(message => {
  //       let parsedMessage = JSON.parse(message);
  //       let parsedContent = JSON.parse(parsedMessage['message']);
  //       let id = parsedContent['id'];
  //       if(id === uuid){
  //         this.foundIntents = parsedContent['result'];
  //         this.makerTokens = [];
  //         this.takerTokens = [];
  //         this.websocketSubscription.unsubscribe();
  //       }
  //     })
  //   }
  // }
}
