import { Injectable } from '@angular/core';

// services
import { FirebaseService } from '../services/firebase.service';
import { WebsocketService } from './websocket.service';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Injectable({
  providedIn: 'root'
})
export class GetOrderService {
  public websocketSubscriptions: any = {};

  public sentOrders: any = {};
  public orderResponses: any = [];

  constructor(
    private firebaseService: FirebaseService,
    private wsService: WebsocketService,
  ) { }

  sendGetOrder(order: any): string {
    const uuid = this.wsService.getOrder(
      order.makerAddress,
      order.makerAmount,
      order.makerToken,
      order.takerToken,
      order.takerAddress
    );
    this.sentOrders[uuid] = order;

    this.websocketSubscriptions[uuid] = this.wsService.websocketSubject
    .subscribe(message => {
      const parsedMessage = JSON.parse(message);
      const parsedContent = JSON.parse(parsedMessage['message']);
      const id = parsedContent['id'];

      if (id === uuid
        && parsedContent['method']
        && parsedContent['method'] === 'orderResponse') {
        const signedOrder = parsedContent['result'];
        signedOrder['clickedDealSeal'] = false;

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
            this.orderResponses = this.orderResponses.filter(
              x => x.id !== signedOrder.id
            );
          }
        });
        this.firebaseService.getUserDetailsFromAddress(signedOrder.makerAddress)
        .then(userDetails => {
          if (userDetails) {
            signedOrder['alias'] = userDetails.alias;
          } else {
            signedOrder['alias'] = order.takerAddress.slice(2, 6);
          }
          this.orderResponses.push(signedOrder);
          this.websocketSubscriptions[uuid].unsubscribe();
        });
      }
    });
    return uuid;
  }

  countOrderResponses(): number {
    return this.orderResponses.length;
  }

}
