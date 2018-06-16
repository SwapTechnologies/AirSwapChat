import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog } from '@angular/material';

import { DialogInfoDealSealComponent } from '../dialogs/dialog-info-deal-seal/dialog-info-deal-seal.component';
import { DialogInfoOrderOfferComponent } from '../dialogs/dialog-info-order-offer/dialog-info-order-offer.component';
import { DialogYesNoComponent } from '../dialogs/dialog-yes-no/dialog-yes-no.component';

// services
import { AirswapdexService } from '../services/airswapdex.service';
import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Erc20Service } from '../services/erc20.service';
import { WebsocketService } from '../services/websocket.service';
import { OrderRequestsService } from '../services/order-requests.service';
import { GetOrderService } from '../services/get-order.service';

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
    public columnSpaceObserver: ColumnSpaceObserverService,
    private erc20Service: Erc20Service,
    public getOrderService: GetOrderService,
    public orderService: OrderRequestsService,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.websocketSubscription) { this.websocketSubscription.unsubscribe(); }
  }

  takerHasEnough(order: any): boolean {
    return (this.takerAmount[order.id] <=
      (order.takerBalanceTakerToken / order.takerDecimals));
  }

  get columnNumber(): number {
    return this.orderService.orderRequests.length < 2 ? 1 : this.columnSpaceObserver.columnNum;
  }

  get columnNumber2(): number {
    return this.getOrderService.orderResponses.length < 2 ? 1 : this.columnSpaceObserver.columnNum;
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

    const dialogRef = this.dialog.open(DialogYesNoComponent, {
      width: '700px',
      data: {
        text: 'Are you sure you want to sign this deal of your ' +
        order.makerAmount / order.makerDecimals  + ' ' + order.makerProps.symbol +
        ' for peers ' + order.takerAmount / order.takerDecimals  + ' ' + order.takerProps.symbol +
        '? ' +
        'Once the signature is sent, you can not take it back. And your peer has the final decision to seal this deal. With nonce ' +
         order.nonce +
         ' you will have to sign the hash ' + prefixedHash,
        yes: 'DO IT',
        no: 'CANCEL'
      }
    });
    return dialogRef.afterClosed().toPromise()
    .then(result => {
      if (result) {
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
    });
  }

  answerOrder(order: any): void {
    if (Number(this.takerAmount[order.id]) >= 0 && this.takerHasEnough(order)) {
      order['clickedOfferDeal'] = true;
      order['takerAmount'] = this.erc20Service.toFixed(Math.floor(Number(this.takerAmount[order.id]) * order['takerDecimals']));
      order['makerAmount'] = this.erc20Service.toFixed(order['makerAmount']);
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
    const dialogRef = this.dialog.open(DialogYesNoComponent, {
      width: '700px',
      data: {
        text: 'Are you sure you want to agree to this deal? ' +
        'Once the transaction is sent it can not be reverted.',
        yes: 'DO IT',
        no: 'CANCEL'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
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
    });
  }

  dealSealDetails(order: any): void {
    const dialogRef = this.dialog.open(DialogInfoDealSealComponent, {
      width: '700px',
      data: order
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sealDeal(order);
      }
    });
  }

  rejectDeal(order: any): void {
    this.getOrderService.orderResponses =
      this.getOrderService.orderResponses.filter(
        x => x.id !== order.id
      );
  }

  detailsForOrderOffer(order): void {
    order['expirationMinutes'] = this.expiration;
    order['takerAmount'] = this.erc20Service.toFixed(Math.floor(Number(this.takerAmount[order.id]) * order['takerDecimals']));

    const dialogRef = this.dialog.open(DialogInfoOrderOfferComponent, {
      width: '700px',
      data: order
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.answerOrder(order);
      }
    });
  }

  rejectToOffer(order): void {
    this.orderService.orderRequests = this.orderService.orderRequests.filter(
      x => x.id !== order.id);
  }
}


