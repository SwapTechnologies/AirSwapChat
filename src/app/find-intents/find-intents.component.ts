import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subject, Subscription } from 'rxjs/Rx';
import { WebsocketService } from '../services/websocket.service';

import { EthereumTokensSN, getTokenByName, getTokenByAddress } from '../services/tokens';

@Component({
  selector: 'app-find-intents',
  templateUrl: './find-intents.component.html',
  styleUrls: ['./find-intents.component.css']
})
export class FindIntentsComponent implements OnInit, OnDestroy {

  public isClicked: boolean = false;
  public makerTokens: string[] = [];
  public takerTokens: string[] = [];

  public selectedToken: any;
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

  findIntentsClicked():void {
    this.isClicked = !this.isClicked; 
  }

  addToken(): void {
    if(this.selectedToken && this.selectedRole) {
      let token = getTokenByName(this.selectedToken);
      if (this.selectedRole === 'maker')
        this.makerTokens.push(token.address)
      else if (this.selectedRole === 'taker')
        this.takerTokens.push(token.address)
    }
  }

  callGetTokenByAddress(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).symbol
    else
      return null
  }

  showIntents():void {
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
        }
      })
    }
  }
}
