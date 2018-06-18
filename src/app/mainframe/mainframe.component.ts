import { Component, OnInit, OnDestroy } from '@angular/core';
// services
import { AngularFireAuth } from 'angularfire2/auth';
import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { ConnectionService } from '../services/connection.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { TakerOrderService } from '../services/taker-order.service';
import { MessagingService } from '../services/messaging.service';
import { MakerOrderService } from '../services/maker-order.service';
import { NotificationService} from '../services/notification.service';
import { TokenService } from '../services/token.service';
import { UserOnlineService } from '../services/user-online.service';
import { WebsocketService } from '../services/websocket.service';
import { MatDialog } from '@angular/material';
import { Erc20Service } from '../services/erc20.service';

// components
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Title } from '@angular/platform-browser';
import { DialogTosComponent } from '../dialogs/dialog-tos/dialog-tos.component';
import { AboutComponent } from '../about/about.component';
import { DonateComponent } from '../donate/donate.component';

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
  public registrationCompleted = false;

  public initializedPage = false;

  constructor(
    private afAuth: AngularFireAuth,
    public columnSpaceObserver: ColumnSpaceObserverService,
    private takerOrderService: TakerOrderService,
    private makerOrderService: MakerOrderService,
    private tokenService: TokenService,
    public connectionService: ConnectionService,
    public firebaseService: FirebaseService,
    public messageService: MessagingService,
    private notifierService: NotificationService,
    private titleService: Title,
    private userOnlineService: UserOnlineService,
    public web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    public dialog: MatDialog,
    // private erc20Service: Erc20Service,
  ) {}


  ngOnInit() {
    this.authUser(); // check for log in of user to firebase
    this.tokenService.getValidatedTokens(); // load the validated token list
    // this.web3service.getAccount()
    // .then(account => {
    //   this.checkTokens();
    // });
  }
  // async checkTokens() {
  //   for (const token of this.tokenService.validatedTokens) {
  //     const tokenAddress = token.address;
  //     const contract = this.erc20Service.getContract(tokenAddress);
  //     // console.log('Checking ', token.name);
  //     let contractName;
  //     let contractDecimals;
  //     let contractSymbol;

  //     await this.erc20Service.name(contract)
  //     .then(name => {
  //       contractName = name;
  //     }).catch(err => {
  //       console.log('Name check error for ', token.name, tokenAddress);
  //     });
  //     await this.erc20Service.symbol(contract)
  //     .then(symbol => {
  //       contractSymbol = symbol;
  //     }).catch(err => {
  //       console.log('symbol check error for ', token.symbol, tokenAddress);
  //     });
  //     await this.erc20Service.decimals(contract)
  //     .then(decimals => {
  //       contractDecimals = Number(decimals);
  //     }).catch(err => {
  //       console.log('decimals check error for ', token.decimals, tokenAddress);
  //     });
  //     const validName = contractName === token.name;
  //     const validSymbol = contractSymbol === token.symbol;
  //     const validDecimals = contractDecimals === token.decimals;

  //     if (validName && validSymbol && validDecimals) {
  //       continue;
  //     }

  //     if (!validName) {
  //       console.log('Name off: ', contractName, token.name);
  //     }
  //     if (!validSymbol) {
  //       console.log('Symbol off: ', contractSymbol, token.symbol);
  //     }
  //     if (!validDecimals) {
  //       console.log('Decimals off: ', contractDecimals, token.decimals);
  //     }
  //   }
  // }

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
        this.firebaseService.userIsVerified = user.emailVerified;
        if (this.connectionService.connected) { // all connections standing? start!
          this.connectionInitialized();
        }
      } else {
        this.connectionService.firebaseConnected = false;
      }
    });

    this.afAuth.authState.subscribe(authState => {
      if (authState) {
        this.firebaseService.userIsVerified = authState.emailVerified;
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
    // triggered either when a firebase connection is established or a websocket connection
    // if both are available -> access page
    if (this.connectionService.connected && this.firebaseService.userIsVerified) {
      this.firebaseService.checkMyUidAndAddressMatch()
      .then((match) => {
        if (match.newAddress) { // uid not in database? -> new user.
          this.firebaseService.registerNewUser()
          .then(() => {
            this.finalizeInitialization();
          })
          .catch((error) => {
            this.firebaseService.logOffUser();
            this.notifierService.showMessage(
              'Ethereum address is already registered with another registered account. ' +
              'Select an unused Ethereum address to connect it with your account.'
            );
          });
        } else { // uid in address found in database
          if (match.addressChanged) { // current public address different than before?
            this.firebaseService.logOffUser();
            this.notifierService.showMessage(
              'Your e-mail is connected to the Ethereum account: ' +
              match.databaseAddress + ' but you tried to connect with ' +
              this.connectionService.loggedInUser.address +
              '. Please set the correct account.'
            );
          } else { // all fine
            this.finalizeInitialization();
          }
        }
      });
    }
  }

  finalizeInitialization(): void {
    // read number of unread messages & deals
    this.timer = TimerObservable.create(0, 500)
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
      this.makerOrderService.listenForOrders();
      this.messageService.startMessenger()
      .then(() => {
        this.initializedPage = true;
      });
    });
  }

  toggleMessenger(): void {
    this.messageService.showMessenger = !this.messageService.showMessenger;
  }

  updateNumbers(): void {
    this.numUnreadMessages = this.messageService.unreadMessages;
    this.showMessageBadge = this.numUnreadMessages > 0;

    this.numUnreadAnswers = this.makerOrderService.orderRequests.length
                            + this.takerOrderService.orderResponses.length;
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

  loggedIn(event) {
    // always triggered when somebody logs in
    if (this.firebaseService.user.uid && !this.firebaseService.userIsVerified) {
      const notifierRef = this.notifierService.showMessage(
        'Please verify your mail.', 'Send mail again.'
      );
      notifierRef.onAction().subscribe(() => {
        this.firebaseService.user.sendEmailVerification();
      });
    }
  }

  signInError(event) {

  }

  openDisclaimer() {
    const dialogRef = this.dialog.open(DialogTosComponent, {
        data: { showConsent: false }
    });
    // dialogRef.updatePosition({ top: '50px', left: '50px' });

  }

  openDonate() {
    this.dialog.open(DonateComponent, {
    });
  }

  openAbout() {
    this.dialog.open(AboutComponent, {
    });
  }
}
