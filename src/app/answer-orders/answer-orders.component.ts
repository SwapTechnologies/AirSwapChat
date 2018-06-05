import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

// services
import { AirswapdexService } from '../services/airswapdex.service';
import { ConnectionService } from '../services/connection.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { WebsocketService } from '../services/websocket.service';
import { OrderRequestsService } from '../services/order-requests.service';
import { GetOrderService } from '../services/get-order.service';
import { EthereumTokensSN, getTokenByAddress } from '../services/tokens';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

interface Order {
  makerAddress: string;
  makerAmount: string;
  makerToken: string;
  takerToken: string;
  takerAddress: string;
}

@Component({
  selector: 'app-answer-orders',
  templateUrl: './answer-orders.component.html',
  styleUrls: ['./answer-orders.component.scss']
})
export class AnswerOrdersComponent implements OnInit, OnDestroy {

  public isOpen = true;
  public orders: Order[] = [];
  public takerAmount: any = {};
  public websocketSubscription: Subscription;
  public openOrderIds: any = {};
  public expiration = 5;
  public timers: any = {};

  constructor(
    private airswapDexService: AirswapdexService,
    private connectionService: ConnectionService,
    public getOrderService: GetOrderService,
    public orderService: OrderRequestsService,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.websocketSubscription) { this.websocketSubscription.unsubscribe(); }
  }

  toFixed(x) {
    if (Math.abs(x) < 1.0) {
      const e = parseInt(x.toString().split('e-')[1], 10);
      if (e) {
          x *= Math.pow(10, e - 1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      let e = parseInt(x.toString().split('+')[1], 10);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10, e);
          x += (new Array(e + 1)).join('0');
      }
    }
    return x;
  }

  takerHasEnough(order: any): boolean {
    return (this.takerAmount[order.id] <=
      (order.takerBalanceTakerToken / order.takerDecimals));
  }

  sign_order(order): Promise<any> {
    order['nonce'] = Math.round(Math.random() * 100 * Date.now()).toString();
    order['expiration'] = Math.round(Date.now() / 1000 + this.expiration * 60).toString();

    const hashV = this.web3service.web3.utils.soliditySha3(
      order['makerAddress'],
      order['makerAmount'],
      order['makerToken'],
      order['takerAddress'],
      order['takerAmount'],
      order['takerToken'],
      order['expiration'],
      order['nonce']
    );
    const prefixedHash =
      this.web3service.web3.eth.accounts.hashMessage(hashV);

    return this.web3service.web3.eth.sign(prefixedHash, this.web3service.connectedAccount)
    .then((signedMessage) => {
      let v, r, s;
      r = signedMessage.slice(0, 66);
      s = '0x' + signedMessage.slice(66, 130);
      v = this.web3service.web3.utils.hexToNumber('0x' + signedMessage.slice(130, 132));
      order['v'] = v;
      order['r'] = r;
      order['s'] = s;
      return order;
    });
  }

  answerOrder(order: any): void {
    if (Number(this.takerAmount[order.id]) >= 0 && this.takerHasEnough(order)) {
      order['clickedOfferDeal'] = true;
      order['takerAmount'] = (Math.floor(Number(this.takerAmount[order.id]) * order['takerDecimals'])).toString();
      order['takerAmount'] = this.toFixed(order['takerAmount']);
      order['makerAmount'] = this.toFixed(order['makerAmount']);
      const uuid = order.id;
      // delete order.id;

      this.sign_order(order)
      .then(fullOrder => {
        this.wsService.sendOrder(order['takerAddress'], fullOrder, uuid);
        this.orderService.orderRequests = this.orderService.orderRequests.filter(
          x => x.id !== uuid);
      }).catch(error => {
        console.log('Sign failed.');
        order['clickedOfferDeal'] = false;
      });
    }
  }

  count(obj: any): number {
    return Object.keys(obj).length;
  }

  sealDeal(order: any): void {
    order['clickedDealSeal'] = true;
    this.airswapDexService.fill(
    order['makerAddress'], order['makerAmount'], order['makerToken'],
    order['takerAddress'],  order['takerAmount'], order['takerToken'],
    order['expiration'], order['nonce'], order['v'], order['r'], order['s'])
    .then(() => {
      this.getOrderService.orderResponses =
      this.getOrderService.orderResponses.filter(
        x => x.id !== order.id
      );
    }).catch(error => {
      console.log('Deal was not sealed.');
      order['clickedDealSeal'] = false;
    });
  }
}


