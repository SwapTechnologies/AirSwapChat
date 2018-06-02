import { Injectable } from '@angular/core';
import { } from '../types/types';

import { EtherAddress, getTokenByAddress } from './tokens';
import { ConnectWeb3Service } from './connectWeb3.service';
import { Erc20Service } from './erc20.service';

@Injectable({
  providedIn: 'root'
})
export class OrderRequestsService {

  public orderRequests: any[] = [];
  constructor(
    private web3service: ConnectWeb3Service,
    private erc20service: Erc20Service,
  ) { }

  get openRequests(): number {
    return this.orderRequests.length;
  }

  addOrder(order:any): void {
    console.log('got order', order)
    order['clickedOfferDeal'] = false;
    order['makerProps'] = getTokenByAddress(order.makerToken);
    order['takerProps'] = getTokenByAddress(order.takerToken);
    order['makerDecimals'] = 10**order.makerProps.decimals;
    order['takerDecimals'] = 10**order.takerProps.decimals;
    
    this.erc20service.balance(order.takerAddress, order.makerToken)
    .then(balance => {
      order['takerBalanceMakerToken'] = balance;
      return this.erc20service.balance(order.takerAddress, order.takerToken)
    }).then(balance => {
      order['takerBalanceTakerToken'] = balance;
      this.orderRequests.push(order);
    })

  }
}
