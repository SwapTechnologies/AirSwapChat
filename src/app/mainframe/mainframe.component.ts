import { Component, OnInit, OnDestroy } from '@angular/core';

// services
import { AngularFireAuth } from 'angularfire2/auth';
import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { ConnectionService } from '../services/connection.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { GetOrderService } from '../services/get-order.service';
import { MessagingService } from '../services/messaging.service';
import { OrderRequestsService } from '../services/order-requests.service';
import { TokenService } from '../services/token.service';
import { UserOnlineService } from '../services/user-online.service';
import { WebsocketService } from '../services/websocket.service';
import { MatDialog } from '@angular/material';

// components
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Title } from '@angular/platform-browser';

import {MatSnackBar} from '@angular/material';

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

  constructor(
    private afAuth: AngularFireAuth,
    public columnSpaceObserver: ColumnSpaceObserverService,
    private getOrderService: GetOrderService,
    private orderRequestsService: OrderRequestsService,
    private tokenService: TokenService,
    public connectionService: ConnectionService,
    public firebaseService: FirebaseService,
    public messageService: MessagingService,
    private titleService: Title,
    private userOnlineService: UserOnlineService,
    public web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
  ) {}


  ngOnInit() {
    this.authUser(); // check for log in of user to firebase
    this.tokenService.getValidatedTokens(); // load the validated token list
  }

  ngOnDestroy() {
    if (this.timer) {
      this.timer.unsubscribe();
    }
  }

  authUser(): void {
    // listen for auth of user
    this.afAuth.auth.onAuthStateChanged((user) => { // triggers everytime the auth state changes
      if (user && user.uid) { // is user logged in?
        this.connectionService.firebaseConnected = true;
        this.connectionService.loggedInUser.alias = user.displayName;
        this.connectionService.loggedInUser.uid = user.uid;
        if (this.connectionService.connected) { // all connections standing? start!
          this.connectionInitialized();
        }
      } else {
        this.connectionService.firebaseConnected = false;
      }
    });
  }

  connectWebsocket(): void {
    // on button click
    this.wsService.initSocket() // initiate handshake with websocket
    .then((connected) => { // websocket succeeded
      if (connected && this.connectionService.connected) { // websocket and firebase? start!
        this.connectionInitialized();
      }
    });
  }

  connectionInitialized(): void {
    if (this.connectionService.connected
    && this.firebaseService.user.emailVerified) {
      this.firebaseService.userIsVerified = true;
      this.firebaseService.checkMyUidAndAddressMatch()
      .then((match) => {
        if (match.newAddress) { // uid not in database? -> new user.
          this.firebaseService.registerNewUser()
          .then(() => {
            this.finalizeInitialization();
          })
          .catch((error) => {
            this.firebaseService.logOffUser();
            this.snackBar.open('Ethereum address is already registered with another account.');
          });
        } else { // uid in address found in database
          if (match.addressChanged) { // current public address different than before?
            this.firebaseService.logOffUser();
            this.snackBar.open('Your e-mail is connected to the Ethereum account: ' +
            match.databaseAddress + ' but you tried to connect with ' +
            this.connectionService.loggedInUser.address +
            '. Please set the correct account.', 'Ok.');
          } else { // all fine
            this.finalizeInitialization();
          }
        }
      });
    }
  }

  finalizeInitialization(): void {
    // read number of unread messages & deals
    this.timer = TimerObservable.create(0, 2000)
    .subscribe( () => this.updateNumbers());

    this.tokenService.getCustomTokenListFromDB(); // load custom token list from firebase

    // check if I have unreceived messages
    // and start listening for messages from others
    this.firebaseService.setMeOnline()
    .then(() => this.firebaseService.getMyPeers()) // get your friend list
    .then((peers) => {
      const promiseList = [];
      for (const peer in peers) {
        if (peers[peer]) {
          promiseList.push(
            this.messageService.addPeer(peer)
            .then((added) => {
              if (added) {
                this.userOnlineService.setPeerToFriend(peer);
              } else {
                // didn't add the peer,... why not? does he even exist?
                this.firebaseService.getUserAddress(peer)
                .then(userAddress => {
                  if (!userAddress) {
                    this.firebaseService.deletePeerFromList(peer);
                  }
                });
              }
            })
          );
        }
      }
      return Promise.all(promiseList);
    })
    .then(() => {
      this.messageService.startMessenger();
    });
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

    const sum_unread = this.numUnreadAnswers + this.numUnreadMessages;
    if (sum_unread > 0) {
      this.setTitle('(' + sum_unread + ') AirSwapChat');
    } else {
      this.setTitle('AirSwapChat');
    }
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
}
