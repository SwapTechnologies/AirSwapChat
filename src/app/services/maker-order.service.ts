import { Injectable } from '@angular/core';

import { ConnectionService } from '../services/connection.service';
import { TokenService } from './token.service';
import { Erc20Service } from './erc20.service';
import { FirebaseService } from './firebase.service';
import { NotificationService} from '../services/notification.service';
import { PriceInfoService } from './price-info.service';
import { WebsocketService } from './websocket.service';


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
    public connectionService: ConnectionService,
    private erc20service: Erc20Service,
    private firebaseService: FirebaseService,
    private priceInfoService: PriceInfoService,
    private tokenService: TokenService,
    private wsService: WebsocketService,
    private notifierService: NotificationService,
  ) { }

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
    if (!helper_maker.token || !helper_taker.token) { // order request token is not known
      console.log('Got an request for a token AirSwapChat does not know.');
      return;
    }
    order['makerProps'] = helper_maker.token;
    order['takerProps'] = helper_taker.token;
    order['makerValid'] = helper_maker.isValid;
    order['takerValid'] = helper_taker.isValid;
    order['bothTokensValid'] = helper_maker.isValid && helper_taker.isValid;
    order['makerDecimals'] = 10 ** order.makerProps.decimals;
    order['takerDecimals'] = 10 ** order.takerProps.decimals;

    const promiseList = [];

    promiseList.push(
      this.priceInfoService.getPricesOfPair(
        helper_maker.token.symbol, helper_taker.token.symbol
      ).then(priceResult => {
        order['UsdPrices'] = priceResult;
      })
    );

    if (this.connectionService.anonymousConnection) {
      order['alias'] = order.takerAddress.slice(2, 6);
    } else {
        promiseList.push(
          this.firebaseService.getUserAliasFromAddress(order.takerAddress)
          .then(alias => {
            order['alias'] = alias;
          })
        );
    }
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

    promiseList.push(
      this.erc20service.balance(order.makerToken, this.connectionService.loggedInUser.address)
      .then(balance => {
        order['makerBalanceMakerToken'] = balance;
      })
    );

    promiseList.push(
      this.erc20service.balance(order.takerToken, this.connectionService.loggedInUser.address)
      .then(balance => {
        order['makerBalanceTakerToken'] = balance;
      })
    );

    Promise.all(promiseList)
    .then(() => {
      this.orderRequests.push(order);
      this.notifierService.showMessageAndRoute(
        'You have a new request for an order',
        'trading'
      );
    });
  }

  rejectRequest(order: any) {
    this.orderRequests = this.orderRequests.filter(x => x.id !== order.id);
    this.wsService.tellDeletedOrder(order.takerAddress, order.id);
  }

  answerOrder(fullOrder: any, cbTradeSucceeded: () => any): void {
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
    // send signed order to taker
    this.wsService.sendOrder(fullOrder.takerAddress, orderAnswer, fullOrder.id);
    this.answeredRequests.push(fullOrder);
    this.orderRequests = this.orderRequests.filter(x => x.id !== fullOrder.id);

    // START listening for an answer to signed order from taker
    this.websocketSubscriptions[fullOrder.id] = this.wsService.websocketSubject
    .subscribe(message => {
      // startListening for an answer of this answered getOrder request
      const parsedMessage = JSON.parse(message);
      const parsedContent = JSON.parse(parsedMessage['message']);
      const id = parsedContent['id'];
      if (id === fullOrder.id) {
        if (parsedContent['method'] === 'deletedOrder') {
          // received answer that taker deleted the order -> stop listening
          this.websocketSubscriptions[fullOrder.id].unsubscribe();

          fullOrder['error'] = 'Taker deleted your signed offer.';
          this.errorRequests.push(fullOrder);
          this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
          this.notifierService.showMessageAndRoute(
            fullOrder.alias + ' deleted your signed offer', 'trading'
          );
        } else if (parsedContent['method'] === 'orderTimedOut') {
          // received answer that the order timed out -> stop listening
          this.websocketSubscriptions[fullOrder.id].unsubscribe();
          if (fullOrder.txHash) {
            fullOrder['error'] = 'It seems order timed out before it was mined. ' +
              'Check on https://etherscan.io/tx/' +fullOrder.txHash;
            this.notifierService.showMessageAndRoute(
              'Your offer for ' + fullOrder.alias +
              ' timed out before it was mined.',  'trading'
            );
          } else {
            fullOrder['error'] = 'Order timed out.';
            this.notifierService.showMessageAndRoute(
              'Your offer for ' + fullOrder.alias + ' timed out.', 'trading'
            );
          }
          this.errorRequests.push(fullOrder);
          this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
        } else if (parsedContent['method'] === 'tookOrder') {
          // received answer that the order was took, keep listening until it's mined
          const txDetails = parsedContent['params'];
          fullOrder['txHash'] = txDetails['txHash']; // taker is about to mine it. listen for the result
          this.notifierService.showMessageAndRoute(
            fullOrder.alias + ' sent the transaction and it is waiting to be mined.',
            'trading'
          );
        } else if (parsedContent['method'] === 'minedOrder') {
          // received answer that the deal is mined and done -> stop listening
          this.websocketSubscriptions[fullOrder.id].unsubscribe();
          this.doneDeals.push(fullOrder);
          this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
          cbTradeSucceeded();
        } else if (parsedContent['method'] === 'orderRejected') {
          // received answer that the deal is mined and done -> stop listening
          this.websocketSubscriptions[fullOrder.id].unsubscribe();
          fullOrder['error'] = 'Smart contract rejected transaction.';
          this.errorRequests.push(fullOrder);
          this.answeredRequests = this.answeredRequests.filter(x => x.id !== id);
          this.notifierService.showMessage(
            'Smart contract rejected transaction with ' + fullOrder.alias
          );
        }
      }
    });
  }
}
