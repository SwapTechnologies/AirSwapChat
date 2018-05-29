import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs/Rx';

import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { WebsocketService } from '../services/websocket.service';
import { AirswapdexService } from '../services/airswapdex.service';

import { EthereumTokensSN, getTokenByAddress } from '../services/tokens';

import { Token } from '../types/types';


@Component({
  selector: 'app-get-order',
  templateUrl: './get-order.component.html',
  styleUrls: ['./get-order.component.scss']
})
export class GetOrderComponent implements OnInit, OnDestroy {

  public receiver: string;
  public makerAmount: string;
  public makerToken: Token;
  public takerToken: Token;

  public tokenList: any[] = EthereumTokensSN;
  public foundIntents: any[] = [];
  public orderResponses: any[] = [];
  public websocketSubscription: Subscription;
  
  constructor(
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    private airswapDexService: AirswapdexService) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if(this.websocketSubscription) this.websocketSubscription.unsubscribe;
  }

  getTokenDecimals(token: string): number {
    if(getTokenByAddress(token))
      return 10**(getTokenByAddress(token).decimals)
    else
      return null
  }
  
  getTokenSymbol(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).symbol
    else
      return null
  }

  stringIsValidNumber(x: string): boolean {
    return Number(x) >= 0;
  }
  
  getOrder():void {
    if(this.web3service.web3.utils.isAddress(this.receiver) 
    && Number(this.makerAmount) >= 0 
    && this.makerToken && this.takerToken) {

      let makerDecimal = 10**this.makerToken.decimals;

      let uuid = this.wsService.getOrder(
        this.receiver,
        (Math.floor(Number(this.makerAmount)*makerDecimal)).toString(),
        this.makerToken.address,
        this.takerToken.address,
        this.web3service.connectedAccount.toLowerCase()
      );

      this.makerToken = undefined;
      this.takerToken = undefined;
      this.makerAmount = undefined;
  
      this.websocketSubscription = this.wsService.websocketSubject
      .subscribe(message => {
        let parsedMessage = JSON.parse(message);
        let parsedContent = JSON.parse(parsedMessage['message']);
        let id = parsedContent['id'];
        
        if(id === uuid){
          let signedOrder = parsedContent['result'];
          this.orderResponses.unshift(signedOrder);
          this.websocketSubscription.unsubscribe();
        }
      })
    }
  }

  sealDeal(order: any): void {
    this.orderResponses = this.orderResponses.filter(
      x => x.id !== order.id);

    this.airswapDexService.fill(
      order['makerAddress'], order['makerAmount'], order['makerToken'],
      order['takerAddress'],  order['takerAmount'], order['takerToken'],
      order['expiration'], order['nonce'], order['v'], order['r'], order['s'])
  }
}
