import { Component, OnInit, OnDestroy } from '@angular/core';

// services
import { AngularFireAuth } from 'angularfire2/auth';
import { ConnectionService } from '../services/connection.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { GetOrderService } from '../services/get-order.service';
import { MessagingService } from '../services/messaging.service';
import { OrderRequestsService } from '../services/order-requests.service';
import { TokenService } from '../services/token.service';
import { WebsocketService } from '../services/websocket.service';

// components
import { AccountComponent } from '../account/account.component';
import { SetIntentsComponent } from '../set-intents/set-intents.component';
import { FindIntentsComponent } from '../find-intents/find-intents.component';
import { GetOrderComponent } from '../get-order/get-order.component';
import { AnswerOrdersComponent } from '../answer-orders/answer-orders.component';
import { MessageSystemComponent } from '../message-system/message-system.component';
import { InitialPageComponent } from '../initial-page/initial-page.component';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-mainframe',
  templateUrl: './mainframe.component.html',
  styleUrls: ['./mainframe.component.scss']
})
export class MainframeComponent implements OnInit, OnDestroy {

  public showMessageBadge = false;
  public numUnreadMessages = 0;

  public showAnswerBadge = false;
  public numUnreadAnswers = 0;

  public showWhosOnlineBadge = false;
  public numWhosOnline = 0;

  public timer: any;
  // public checkVerificationTimer: any;
  public rareTimer: any;

  constructor(
    private afAuth: AngularFireAuth,
    private getOrderService: GetOrderService,
    private orderRequestsService: OrderRequestsService,
    private tokenService: TokenService,
    public connectionService: ConnectionService,
    public firebaseService: FirebaseService,
    public messageService: MessagingService,
    public web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
  ) {}


  ngOnInit() {
    this.authUser();
    this.tokenService.getValidatedTokens();
    this.tokenService.getCustomTokenList();

    this.timer = TimerObservable.create(0, 2000)
    .subscribe( () => this.updateNumbers());
    this.rareTimer = TimerObservable.create(0, 60000)
    .subscribe( () => this.updateRareNumbers());
  }

  ngOnDestroy() {
    if (this.timer) {
      this.timer.unsubscribe();
    }
  }

  authUser(): void {
    // listen for auth of user
    this.afAuth.auth.onAuthStateChanged((user) => {
      if (user && user.uid) {
        this.connectionService.loggedInUser.alias = user.displayName;
        this.connectionService.loggedInUser.uid = user.uid;
        this.connectionService.firebaseConnected = true;
        if (this.connectionService.connected) {
          this.connectionInitialized();
        }
      } else {
        this.connectionService.firebaseConnected = false;
        this.firebaseService.stopReadWhosOnline();
      }
    });
  }

  connectWebsocket(): void {
    this.wsService.initSocket()
    .then((connected) => {
      if (connected && this.connectionService.connected) {
        this.connectionInitialized();
      }
    });
  }

  connectionInitialized(): void {
    if (this.connectionService.connected && this.firebaseService.user.emailVerified) {
      this.firebaseService.userIsVerified = true;
      this.firebaseService.registerUser();
      this.firebaseService.pingMe();
      this.firebaseService.initReadWhosOnline();
      this.messageService.startMessenger();
    } else {
      // this.checkVerificationTimer = TimerObservable.create(0, 2000)
      // .subscribe( () => {
      //   console.log('check.');
      //   console.log(this.firebaseService.user);
      //   if (this.firebaseService.user.emailVerified) {
      //     this.checkVerificationTimer.unsubscribe();
      //     this.connectionInitialized();
      //   }
      // });
    }

  }

  toggleMessenger(): void {
    this.messageService.showMessenger = !this.messageService.showMessenger;
  }

  updateNumbers(): void {
    this.numUnreadMessages = this.messageService.unreadMessages;
    this.showMessageBadge = this.numUnreadMessages > 0;

    this.numUnreadAnswers = this.orderRequestsService.openRequests
                            + this.getOrderService.countOrderResponses();
    this.showAnswerBadge = this.numUnreadAnswers > 0;
  }

  updateRareNumbers(): void {
    if (this.connectionService.connected) {
      this.firebaseService.pingMe();
    }
  }
}
