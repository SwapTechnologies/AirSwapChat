import { Injectable } from '@angular/core';

import { TokenService } from './token.service';
import { Erc20Service } from './erc20.service';
import { FirebaseService } from './firebase.service';
import { PriceInfoService } from './price-info.service';
import { WebsocketService } from './websocket.service';
import { MatSnackBar } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class MakerOrderService {
  public listenGetOrderSubscription; // listening for getOrder
  public websocketSubscriptions: any = {}; // listening for responses to to answered getOrder offers
  public orderRequests: any[] = []; // all open orderRequests
  public answeredRequests: any[] = []; // orders that were answered
  public doneDeals: any[] = []; // orders that were done in this session
  public errorRequests: any[] = [];

  constructor(
    private erc20service: Erc20Service,
    private firebaseService: FirebaseService,
    private priceInfoService: PriceInfoService,
    private tokenService: TokenService,
    private wsService: WebsocketService,
    private snackBar: MatSnackBar,
  ) { }

  get openRequests(): number {
    return this.orderRequests.length;
  }

  listenForOrders(): void {
    // start a listener that looks for getOrder messages
    console.log('Start listening for getOrder requests.');
    this.listenGetOrderSubscription =
    this.wsService.websocketSubject
    .subscribe(message => {
      const receivedMessage = JSON.parse(message);
      const content = JSON.parse(receivedMessage['message']);
      const method = content['method'];
      if (method === 'getOrder') {
        const uuid = content['id'];
        const makerAddress = receivedMessage['receiver'];
        const makerAmount = content['params']['makerAmount'];
        const makerToken = content['params']['makerToken'];
        const takerToken = content['params']['takerToken'];
        const takerAddress = content['params']['takerAddress'];

        const newOrder = {
          makerAddress: makerAddress,
          makerAmount: makerAmount,
          makerToken: makerToken,
          takerToken: takerToken,
          takerAddress: takerAddress,
          id: uuid
        };
        this.addOrder(newOrder);
      }
    });
  }

  addOrder(order: any): void {
    // called whenever a getOrder is received
    order['clickedOfferDeal'] = false;
    const helper_maker = this.tokenService.getTokenAndWhetherItsValid(order.makerToken);
    const helper_taker = this.tokenService.getTokenAndWhetherItsValid(order.takerToken);
    order['makerProps'] = helper_maker.token;
    order['takerProps'] = helper_taker.token;
    order['makerValid'] = helper_maker.isValid;
    order['takerValid'] = helper_taker.isValid;
    order['bothTokensValid'] = helper_maker.isValid && helper_taker.isValid;
    order['makerDecimals'] = 10 ** order.makerProps.decimals;
    order['takerDecimals'] = 10 ** order.takerProps.decimals;

    this.priceInfoService.getPriceOfToken(
      helper_maker.token.symbol + ',' + helper_taker.token.symbol)
    .then(priceResult => {
      if (priceResult) {
        order['UsdPrices'] = {
          makerToken: priceResult[helper_maker.token.symbol]['USD'],
          takerToken: priceResult[helper_taker.token.symbol]['USD']
        };
      }
    });

    const promiseList = [];
    promiseList.push(
      this.firebaseService.getUserAliasFromAddress(order.takerAddress)
      .then(alias => {
        order['alias'] = alias;
      })
    );
    promiseList.push(
      this.erc20service.balance(order.makerToken, order.takerAddress)
      .then(balance => {
        order['takerBalanceMakerToken'] = balance;
      })
    );
    promiseList.push(
      this.erc20service.balance(order.takerToken, order.takerAddress)
      .then(balance => {
        order['takerBalanceTakerToken'] = balance;
      })
    );

    Promise.all(promiseList)
    .then(() => {
      this.orderRequests.push(order);
      this.snackBar.open('You have a new request for an order', 'Ok', {duration: 2000});
    });
  }

  rejectRequest(order: any) {
    this.orderRequests = this.orderRequests.filter(x => x.id !== order.id);
    this.wsService.tellDeletedOrder(order.takerAddress, order.id);
  }

  answerOrder(fullOrder: any, callback?: () => any): void {
    // full order contains all information and signature by maker
    const orderAnswer = {
      makerAddress: fullOrder.makerAddress,
      makerAmount: fullOrder.makerAmount,
      makerToken: fullOrder.makerToken,
      takerAddress: fullOrder.takerAddress,
      takerAmount: fullOrder.takerAmount,
      takerToken: fullOrder.takerToken,
      expiration: fullOrder.expiration,
      nonce: fullOrder.nonce,
      v: fullOrder.v,
      r: fullOrder.r,
      s: fullOrder.s
    };
    this.wsService.sendOrder(fullOrder.takerAddress, orderAnswer, fullOrder.id);
    this.answeredRequests.push(fullOrder);
    this.orderRequests = this.orderRequests.filter(x => x.id !== fullOrder.id);
    this.websocketSubscriptions[fullOrder.id] = this.wsService.websocketSubject
    .subscribe(message => {
      // startListening for an answer of this answered getOrder request
      let parsedMessage = JSON.parse(message);
      let parsedContent = JSON.parse(parsedMessage['message']);
      const id = parsedContent['id'];
      if (id === fullOrder.id) {
        this.websocketSubscriptions[fullOrder.id].unsubscribe(); // received an answer -> stop listening

        if (parsedContent['method'] === 'deletedOrder') {
          fullOrder['error'] = 'Taker deleted your signed offer.';
          this.errorRequests.push(fullOrder);
          this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
          this.snackBar.open(fullOrder.alias + ' deleted your signed offer', 'Ok.', {duration: 3000});
        } else if (parsedContent['method'] === 'orderTimedOut') {
          fullOrder['error'] = 'Order timed out.';
          this.errorRequests.push(fullOrder);
          this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
          this.snackBar.open('Your offer for ' + fullOrder.alias + ' timed out.', 'Ok.', {duration: 3000});
        } else if (parsedContent['method'] === 'tookOrder') {
          const txDetails = parsedContent['params'];
          fullOrder['txHash'] = txDetails['txHash']; // taker is about to mine it. listen for the result
          this.snackBar.open(fullOrder.alias + ' send the transaction to the blockchain and it is waiting to be mined.',
                             'Ok.', {duration: 3000});
          this.websocketSubscriptions[fullOrder.id] = this.wsService.websocketSubject
          .subscribe(miningMessage => {
            parsedMessage = JSON.parse(miningMessage);
            parsedContent = JSON.parse(parsedMessage['message']);
            if (id === fullOrder.id) {
              if (parsedContent['method'] === 'orderTimedOut') {
                fullOrder['error'] = 'It seems order timed out before it was mined. Check on https://rinkeby.etherscan.io/tx/' +
                                      fullOrder.txHash;
                this.errorRequests.push(fullOrder);
                this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
                this.snackBar.open('Your offer for ' + fullOrder.alias + ' timed out before it could be mined.', 'Ok.', {duration: 3000});
              } else if (parsedContent['method'] === 'minedOrder') {
                this.doneDeals.push(fullOrder);
                this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
                if (callback) {
                  callback();
                }
              }
            }
          });
        }
      }
    });
  }
}
