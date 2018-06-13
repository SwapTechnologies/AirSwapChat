import { Injectable } from '@angular/core';
import { } from '../types/types';

import { ConnectWeb3Service } from './connectWeb3.service';
import { TokenService, EtherAddress } from './token.service';
import { Erc20Service } from './erc20.service';
import { FirebaseService } from './firebase.service';
import { PriceInfoService } from './price-info.service';
@Injectable({
  providedIn: 'root'
})
export class OrderRequestsService {

  public orderRequests: any[] = [];
  constructor(
    private erc20service: Erc20Service,
    private firebaseService: FirebaseService,
    private priceInfoService: PriceInfoService,
    private web3service: ConnectWeb3Service,
    private tokenService: TokenService
  ) { }

  get openRequests(): number {
    return this.orderRequests.length;
  }

  addOrder(order: any): void {
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
    });
  }
}
