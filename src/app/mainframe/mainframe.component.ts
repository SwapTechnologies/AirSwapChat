import { Component, OnInit, OnDestroy } from '@angular/core';

//services
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { MessagingService } from '../services/messaging.service';
import { OrderRequestsService } from '../services/order-requests.service';
import { WebsocketService } from '../services/websocket.service';
import { WhosOnlineService } from '../services/whos-online.service';

//components
import { AccountComponent } from '../account/account.component';
import { SetIntentsComponent } from '../set-intents/set-intents.component';
import { FindIntentsComponent } from '../find-intents/find-intents.component';
import { GetOrderComponent } from '../get-order/get-order.component';
import { AnswerOrdersComponent } from '../answer-orders/answer-orders.component';
import { MessageSystemComponent } from '../message-system/message-system.component';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-mainframe',
  templateUrl: './mainframe.component.html',
  styleUrls: ['./mainframe.component.scss']
})
export class MainframeComponent implements OnInit {

  public showMessenger: boolean = false;

  public showMessageBadge: boolean = false;
  public numUnreadMessages: number = 0;

  public showAnswerBadge: boolean = false;
  public numUnreadAnswers: number = 0;

  public showWhosOnlineBadge: boolean = false;
  public numWhosOnline: number = 0;
  
  public timer: any;
  public rareTimer: any;

  constructor(
    private firebaseService: FirebaseService,
    private messageService: MessagingService,
    public orderService: OrderRequestsService,
    public web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    public whoOnlineService: WhosOnlineService,
  ) {}


  ngOnInit() {
    this.timer = TimerObservable.create(0, 2000)
    .subscribe( () => this.updateNumbers());
    this.rareTimer = TimerObservable.create(0, 10000)
    .subscribe( () => this.updateRareNumbers());
    
  }

  ngOnDestroy() {
    if(this.timer)
      this.timer.unsubscribe();
  }

  toggleMessenger(): void {
    this.showMessenger = !this.showMessenger;
  }

  updateNumbers(): void {
    this.numUnreadMessages = this.messageService.unreadMessages;
    this.showMessageBadge = this.numUnreadMessages>0;

    this.numUnreadAnswers = this.orderService.openRequests;
    this.showAnswerBadge = this.numUnreadAnswers>0;
  }

  updateRareNumbers(): void {
    this.whoOnlineService.numOnline
    .then((numWhosOnline) => {
      this.numWhosOnline = numWhosOnline;
      this.showWhosOnlineBadge = this.numWhosOnline>0;
    })
    
    if(this.wsService.connectionEstablished)
      this.firebaseService.pingUser(this.wsService.loggedInUser);
    }
}