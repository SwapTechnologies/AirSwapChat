import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs/Rx';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { WebsocketService } from '../services/websocket.service';
import { OrderRequestsService } from '../services/order-requests.service';
import { EthereumTokensSN, getTokenByAddress } from '../services/tokens';

type Order = {
  makerAddress: string,
  makerAmount: string,
  makerToken: string,
  takerToken: string,
  takerAddress: string
}

@Component({
  selector: 'app-answer-orders',
  templateUrl: './answer-orders.component.html',
  styleUrls: ['./answer-orders.component.scss']
})
export class AnswerOrdersComponent implements OnInit, OnDestroy {

  public isOpen: boolean = true;
  public orders: Order[] = [];
  public takerAmount: Number[];
  public websocketSubscription: Subscription;
  public openOrderIds: any = {};

  constructor(
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    public orderService: OrderRequestsService,
  ) { }

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

  toFixed(x) {
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split('e-')[1]);
      if (e) {
          x *= Math.pow(10,e-1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split('+')[1]);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10,e);
          x += (new Array(e+1)).join('0');
      }
    }
    return x;
  }

  sign_order(order): Promise<any> {
    order['nonce'] = Math.round(Math.random()*100*Date.now()).toString();
    order['expiration'] = Math.round(Date.now()/1000 + 1000).toString();
    
    let hashV = this.web3service.web3.utils.soliditySha3(
      order['makerAddress'],
      order['makerAmount'],
      order['makerToken'],
      order['takerAddress'],
      order['takerAmount'],
      order['takerToken'],
      order['expiration'],
      order['nonce']
    )
    let prefixedHash = 
      this.web3service.web3.eth.accounts.hashMessage(hashV);
  
    return this.web3service.web3.eth.sign(prefixedHash,this.web3service.connectedAccount)
    .then((signedMessage) => {
      let v, r, s;
      r = signedMessage.slice(0,66)
      s = '0x'+signedMessage.slice(66,130)
      v = this.web3service.web3.utils.hexToNumber('0x'+signedMessage.slice(130,132))
      order['v'] = v;
      order['r'] = r;
      order['s'] = s;
      return order;
    })
  }

  answerOrder(order: Order):void {
    if(Number(order['takerAmount']) >= 0) {
      let orderCopy = JSON.parse(JSON.stringify(order))

      let tokenDecimals = this.getTokenDecimals(order['takerToken']);
      orderCopy['takerAmount'] = (Math.floor(Number(order['takerAmount'])*tokenDecimals)).toString()
      orderCopy['takerAmount'] = this.toFixed(orderCopy['takerAmount']);
      orderCopy['makerAmount'] = this.toFixed(orderCopy['makerAmount']);
      let uuid = orderCopy.id;
      // delete orderCopy.id;
  
      this.orderService.orderRequests = this.orderService.orderRequests.filter(
        x => x.id !== uuid)
      this.sign_order(orderCopy)
      .then(fullOrder => {
        this.wsService.sendOrder(orderCopy['takerAddress'], fullOrder, uuid);
      })
    }
  }
}
