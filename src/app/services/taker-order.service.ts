import { Injectable } from '@angular/core';

// services
import { AirswapdexService } from '../services/airswapdex.service';
import { FirebaseService } from '../services/firebase.service';
import { TokenService } from '../services/token.service';
import { WebsocketService } from './websocket.service';

import { PriceInfoService } from './price-info.service';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { MatSnackBar } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class TakerOrderService {
  public websocketSubscriptions: any = {}; // open subscriptions after getOrder, which you are listening to for answers

  public sentOrders: any = []; // orders which you have send via getOrder
  public orderResponses: any = []; // orders which a maker has made an offer for
  public pendingOrders: any = []; // orders which have been accepted by you and are waiting to be mined
  public finishedOrders: any = []; // done deals in this session

  public errorOrders: any = [];

  constructor(
    private airswapDexService: AirswapdexService,
    private firebaseService: FirebaseService,
    private priceInfoService: PriceInfoService,
    private tokenService: TokenService,
    private wsService: WebsocketService,
    public _snackBar: MatSnackBar,
  ) { }

  sendGetOrder(order: any): string {
    // send it away
    const uuid = this.wsService.getOrder(
      order.makerAddress,
      order.makerAmount,
      order.makerToken,
      order.takerToken,
      order.takerAddress
    );
    order['sentRequest'] = 'Sent request for an offer of ' +
    order.makerAmount / order.makerDecimals + ' ' +
    order.makerProps.symbol;
    order.id = uuid;
    this.sentOrders.push(order);

    // look for an answer
    this.websocketSubscriptions[uuid] = this.wsService.websocketSubject
    .subscribe(message => {
      // startListening for an answer of this getOrder request
      const parsedMessage = JSON.parse(message);
      const parsedContent = JSON.parse(parsedMessage['message']);
      const id = parsedContent['id'];
      if (id === uuid) {
        this.websocketSubscriptions[uuid].unsubscribe();
        if (parsedContent['method'] === 'deletedOrder') {
          this.errorOrders.push(order);
          this.sentOrders = this.sentOrders.filter(x => x.id !== id);
          order['error'] = 'Maker deleted the request.';
          this._snackBar.open(order.peer.alias + ' deleted your request for an offer about ' +
          order.makerAmount / order.makerDecimals +
          ' ' + order.makerProps.symbol, 'Ok.', {duration: 2000});
        } else if (parsedContent['result']) {
          const signedOrder = parsedContent['result'];
          signedOrder['id'] = id;
          signedOrder['clickedDealSeal'] = false;
          const helper_makerToken =
            this.tokenService.getTokenAndWhetherItsValid(signedOrder['makerToken']);
          signedOrder['makerProps'] = helper_makerToken.token;
          signedOrder['makerIsValid'] = helper_makerToken.isValid;
          signedOrder['makerDecimals'] = 10 ** signedOrder['makerProps'].decimals;

          const helper_takerToken =
            this.tokenService.getTokenAndWhetherItsValid(signedOrder['takerToken']);
          signedOrder['takerProps'] = helper_takerToken.token;
          signedOrder['takerIsValid'] = helper_takerToken.isValid;
          signedOrder['takerDecimals'] = 10 ** signedOrder['takerProps'].decimals;

          this.priceInfoService.getPriceOfToken(
            signedOrder.makerProps.symbol + ',' + signedOrder.takerProps.symbol)
          .then(priceResult => {
            if (priceResult) {
              signedOrder['UsdPrices'] = {
                makerToken: priceResult[signedOrder.makerProps.symbol]['USD'],
                takerToken: priceResult[signedOrder.takerProps.symbol]['USD']
              };
            }
          });

          signedOrder['timedOut'] = false;
          signedOrder['timer'] = TimerObservable.create(0, 1000)
          .subscribe( () => {
            const currentTime = Date.now() / 1000;
            const difference = signedOrder['expiration'] - currentTime;
            signedOrder['minutesLeft'] = Math.floor(difference / 60);
            signedOrder['secondsLeft'] = Math.floor(difference % 60);

            if (signedOrder['minutesLeft'] <= 0 && signedOrder['secondsLeft'] <= 0) {
              signedOrder['timedOut'] = true;
              signedOrder['timer'].unsubscribe();
              signedOrder['error'] = 'Order timed out.';
              this.errorOrders.push(signedOrder);
              this.orderResponses = this.orderResponses.filter(x => x.id !== signedOrder.id);
              this.pendingOrders = this.pendingOrders.filter(x => x.id !== signedOrder.id);
              this.wsService.tellOrderTimedOut(signedOrder.makerAddress, signedOrder.id);
            }
          });
          this.firebaseService.getUserAliasFromAddress(signedOrder.makerAddress)
          .then(alias => {
            signedOrder['alias'] = alias;
            this.sentOrders  = this.sentOrders.filter(x => x.id !== signedOrder.id);
            this.orderResponses.push(signedOrder);
            this._snackBar.open('You received an answer from ' + order.peer.alias, 'Ok', {duration: 3000});
          });
        } else {
          if (parsedContent['error']) {
            this._snackBar.open('An error occured during get-order: ' +
            parsedContent['error']['message'], 'Ok.', {duration: 3000});
          }
        }
      }
    });
    return uuid;
  }

  countOrderResponses(): number {
    return this.orderResponses.length;
  }

  sealDeal(order: any, cbTookOrder?: () => any, cbMinedOrder?: () => any): Promise<any> {
    // fill will tell maker about mining it when sent
    // and adds txHash to the order for the taker
    return this.airswapDexService.fill(order, (txHash) => {
      order['txHash'] = txHash;
      this.pendingOrders.push(order);
      this.orderResponses = this.orderResponses.filter(x => x.id !== order.id);
      this.wsService.tookOrder(order.id, txHash, order.makerAddress);
      cbTookOrder();
    })
    .then(() => {
      order.timer.unsubscribe();
      this.pendingOrders = this.pendingOrders.filter(x => x.id !== order.id);
      this.finishedOrders.push(order);
      this.wsService.tellMakerMinedOrder(order.makerAddress, order.id);
      cbMinedOrder();
    }).catch(error => {
      console.log('Deal was not sealed.');
      order['clickedDealSeal'] = false;
    });
  }

  rejectDeal(order: any, callback?: () => any) {
    console.log(order);
    order.timer.unsubscribe();
    this.orderResponses = this.orderResponses.filter(x => x.id !== order.id);
    order['error'] = 'You aborted the trade.';
    this.errorOrders.push(order);
    this.wsService.tellDeletedOrder(order.makerAddress, order.id);
    if (callback) {
      callback();
    }
  }

}
