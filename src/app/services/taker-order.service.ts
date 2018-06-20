import { Injectable } from '@angular/core';

// services
import { AirswapdexService } from '../services/airswapdex.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { ConnectionService } from '../services/connection.service';
import { FirebaseService } from '../services/firebase.service';
import { NotificationService} from '../services/notification.service';
import { TokenService } from '../services/token.service';
import { WebsocketService } from './websocket.service';

import { PriceInfoService } from './price-info.service';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

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
    private connectionService: ConnectionService,
    private firebaseService: FirebaseService,
    private priceInfoService: PriceInfoService,
    private tokenService: TokenService,
    private web3Service: ConnectWeb3Service,
    private wsService: WebsocketService,
    private notifierService: NotificationService,
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
        if (parsedContent['method'] === 'deletedOrder') {
          // received answer that maker deleted the order -> stop listening
          this.websocketSubscriptions[uuid].unsubscribe();

          order['error'] = 'Maker deleted the request.';
          this.errorOrders.push(order);
          this.sentOrders = this.sentOrders.filter(x => x.id !== id);

          this.notifierService.showMessageAndRoute(
            order.peer.alias + ' deleted your request for an offer about ' +
            order.makerAmount / order.makerDecimals + ' ' + order.makerProps.symbol,
            'trading'
          );
        } else if (parsedContent['result']) {
          // this is an answer to getOrder, either by a person or by a bot
          // don't expect any further answers from the maker. I take the deal or not. Stop listening
          this.websocketSubscriptions[uuid].unsubscribe();
          const signedOrder = parsedContent['result'];

          // check signature of signedOrder
          const signature = signedOrder.r + signedOrder.s.slice(2) + signedOrder.v.slice(2);

          const hashV = this.web3Service.web3.utils.soliditySha3(
            signedOrder.makerAddress,
            signedOrder.makerAmount,
            signedOrder.makerToken,
            signedOrder.takerAddress,
            signedOrder.takerAmount,
            signedOrder.takerToken,
            signedOrder.expiration,
            signedOrder.nonce
          );
          this.web3Service.web3.eth.personal.ecRecover(hashV, signature)
          .then(recoveredMakerAddress => {
            if (recoveredMakerAddress === signedOrder.makerAddress) {
              // valid signature
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
                  let priceMakerToken = priceResult[signedOrder.makerProps.symbol];
                  if (!priceMakerToken) {
                    priceMakerToken = 0;
                  } else {
                    priceMakerToken = priceMakerToken['USD'];
                  }
                  let priceTakerToken = priceResult[signedOrder.takerProps.symbol];
                  if (!priceTakerToken) {
                    priceTakerToken = 0;
                  } else {
                    priceTakerToken = priceTakerToken['USD'];
                  }
                  signedOrder['UsdPrices'] = {
                    makerToken: priceMakerToken,
                    takerToken: priceTakerToken
                  };
                } else {
                  signedOrder['UsdPrices'] = {
                    makerToken: 0,
                    takerToken: 0
                  };
                }
              });

              signedOrder['timedOut'] = false;
              // create a countdown timer for the order to expire
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
              if (this.connectionService.anonymousConnection) {
                signedOrder['alias'] = signedOrder.makerAddress.slice(2, 6);
                this.sentOrders  = this.sentOrders.filter(x => x.id !== signedOrder.id);
                this.orderResponses.push(signedOrder);
                this.notifierService.showMessageAndRoute(
                  'You received an answer from ' + order.peer.alias +
                  ' with valid signature.',
                  'trading'
                );
              } else {
                this.firebaseService.getUserAliasFromAddress(signedOrder.makerAddress)
                .then(alias => {
                  signedOrder['alias'] = alias;
                  this.sentOrders  = this.sentOrders.filter(x => x.id !== signedOrder.id);
                  this.orderResponses.push(signedOrder);
                  this.notifierService.showMessageAndRoute(
                    'You received an answer from ' + order.peer.alias +
                    ' with valid signature.',
                    'trading'
                  );
                });
              }
            } else {
              // invalid signature
              this.sentOrders  = this.sentOrders.filter(x => x.id !== signedOrder.id);
              signedOrder['error'] = 'Invalid signature.';
              this.errorOrders.push(signedOrder);
              this.notifierService.showMessage(
                'Received signature from ' + signedOrder.alias + ' is invalid.'
              );
            }
          });
        } else {
          // received answer message is neither deletedOrder or one with a result
          if (parsedContent['error']) {
            this.notifierService.showMessageAndRoute(
              'An error occured during get-order: ' + parsedContent['error']['message'],
              'trading'
            );
          }
        }
      }
    });
    return uuid;
  }

  sealDeal(order: any, cbTookOrder: () => any, cbMinedOrder: () => any): Promise<any> {
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
      order.timer.unsubscribe(); // order is mined, stop listening for it
      this.finishedOrders.push(order);
      this.pendingOrders = this.pendingOrders.filter(x => x.id !== order.id);
      this.wsService.tellMakerMinedOrder(order.makerAddress, order.id);
      cbMinedOrder();
    }).catch(error => {
      if (error && error.message && error.message.includes('Transaction ran out of gas.')) {
        order.timer.unsubscribe(); // order is mined, stop listening for it
        order['error'] = 'Smart contract rejected transaction.';
        this.errorOrders.push(order);
        this.pendingOrders = this.pendingOrders.filter(x => x.id !== order.id);
        this.wsService.tellOrderRejected(order.makerAddress, order.id);
        this.notifierService.showMessage(
          'Smart contract rejected transaction with ' + order.alias
        );
      } else {
        console.log('Deal was not sealed.');
        order['clickedDealSeal'] = false;
      }
    });
  }

  rejectDeal(order: any, callback?: () => any) {
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
