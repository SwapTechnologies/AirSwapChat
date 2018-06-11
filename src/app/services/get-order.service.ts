import { Injectable } from '@angular/core';

// services
import { FirebaseService } from '../services/firebase.service';
import { TokenService } from '../services/token.service';
import { WebsocketService } from './websocket.service';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Injectable({
  providedIn: 'root'
})
export class GetOrderService {
  public websocketSubscriptions: any = {};

  public sentOrders: any = {};
  public errorOrders: any = {};
  public orderResponses: any = [];

  constructor(
    private firebaseService: FirebaseService,
    private tokenService: TokenService,
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
      console.log(message, uuid === id);
      if (id === uuid) {
        this.websocketSubscriptions[uuid].unsubscribe();

        if (parsedContent['result']) {
          const signedOrder = parsedContent['result'];
          signedOrder['clickedDealSeal'] = false;

          signedOrder['makerProps'] = this.tokenService.getToken(signedOrder['makerToken']);
          signedOrder['takerProps'] = this.tokenService.getToken(signedOrder['takerToken']);
          signedOrder['makerDecimals'] = 10 ** signedOrder['makerProps'].decimals;
          signedOrder['takerDecimals'] = 10 ** signedOrder['takerProps'].decimals;

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
          this.firebaseService.getUserAliasFromAddress(signedOrder.makerAddress)
          .then(alias => {
            signedOrder['alias'] = alias;
            this.orderResponses.push(signedOrder);
          });
        } else {
          console.log('An error occured during get-order.');
          if (parsedContent['error']) {
            const errorMessage = parsedContent['error']['message'];
            this.errorOrders[uuid] = errorMessage;
          }
        }
      }
    });
    return uuid;
  }

  countOrderResponses(): number {
    return this.orderResponses.length;
  }

}
