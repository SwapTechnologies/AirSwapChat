import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs/Rx';

import { WebsocketService } from './websocket.service';
import { ConnectWeb3Service } from './connectWeb3.service';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Injectable({
  providedIn: 'root'
})
export class GetOrderService {
  public websocketSubscriptions: any = {};

  public sentOrders: any = {};
  public orderResponses: any = [];

  constructor(
    private wsService: WebsocketService,
    private web3service: ConnectWeb3Service,
  ) { }

  sendGetOrder(order: any): string {
    let uuid = this.wsService.getOrder(
      order.makerAddress,
      order.makerAmount,
      order.makerToken,
      order.takerToken,
      order.takerAddress
    );
    this.sentOrders[uuid] = order;

    this.websocketSubscriptions[uuid] = this.wsService.websocketSubject
    .subscribe(message => {
      let parsedMessage = JSON.parse(message);
      let parsedContent = JSON.parse(parsedMessage['message']);
      let id = parsedContent['id'];
      
      if(id === uuid 
        && parsedContent['method'] 
        && parsedContent['method'] === 'orderResponse') {
        let signedOrder = parsedContent['result'];
        signedOrder['clickedDealSeal'] = false;
        let currentTime = Date.now()/1000;
        let difference = signedOrder['expiration'] - currentTime;
        signedOrder['minutesLeft'] = Math.floor(difference/60);
        signedOrder['secondsLeft'] = Math.floor(difference%60);
        signedOrder['timedOut'] = false;
        signedOrder['timer'] = TimerObservable.create(0, 1000)
        .subscribe( () => {
          let currentTime = Date.now()/1000;
          let difference = signedOrder['expiration'] - currentTime;
          signedOrder['minutesLeft'] = Math.floor(difference/60);
          signedOrder['secondsLeft'] = Math.floor(difference%60);
          
          if(signedOrder['minutesLeft'] <= 0 && signedOrder['secondsLeft'] <= 0) {
            signedOrder['timedOut'] = true;
            signedOrder['timer'].unsubscribe();
            this.orderResponses = this.orderResponses.filter(
              x => x.id !== signedOrder.id
            );
          }
        });
        this.orderResponses.push(signedOrder);
        this.websocketSubscriptions[uuid].unsubscribe();
      }
    })
    return uuid
  }

  countOrderResponses(): number {
    return this.orderResponses.length;
  }

}
