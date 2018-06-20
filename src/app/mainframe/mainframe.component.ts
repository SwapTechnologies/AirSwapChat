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
import { DialogEnterWithoutRegisterComponent } from '../dialogs/dialog-enter-without-register/dialog-enter-without-register.component';
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
      // this.checkTokens();
      // const makerAddress = '0xdbd6f75aedebdf1c3d2b7085229450200e410fbb';
      // const makerToken = '0xbaed6c1f8cd4a443cc372fd15d770e3764b4b2e7';
      // const makerAmount = '0';
      // const takerAddress = '0xc7a1b6c071e114c1cd587182aec6838a179a0a11';
      // const takerToken = '0xcc1cbd4f67cceb7c001bd4adf98451237a193ff8';
      // const takerAmount = '10000';
      // const expiration = '1529415197';
      // const nonce = '13186835645505';
      // const hash = '0xb177314e2488ba418575f7d4680ae299234430a87872c4cd45ea8e84508cf25a';
      // const r = '0xa996e2aeec06a64123cf1e2fb38dc50fa8454da007914e8ca61264e1899c4042';
      // const s = '0x720829dae650ea7fca18f0867dca99caad3e000084ba637f11d3aecf5b8132b6';
      // const v = '0x1c';
      // const signature = r + s.slice(2) + v.slice(2);
      // console.log(signature);
      // const hashV = this.web3service.web3.utils.soliditySha3(
      //   makerAddress,
      //   makerAmount,
      //   makerToken,
      //   takerAddress,
      //   takerAmount,
      //   takerToken,
      //   expiration,
      //   nonce
      // );
      // // this.web3service.web3.eth.personal.sign(hashV, this.web3service.connectedAccount)
      // // .then(console.log);
      // console.log('ecrecover');
      // this.web3service.web3.eth.personal.ecRecover(hashV, signature)
      // .then(result => console.log('result:', result === makerAddress));

      // console.log('ecrecover');
      // console.log(hashV);
      // const prefixedHash = this.web3service.web3.eth.accounts.hashMessage(hashV);
      // console.log(prefixedHash);
      // // this.web3service.web3.eth.sign(prefixedHash, this.web3service.connectedAccount)
      // // .then(console.log);
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
    this.connectionService.anonymousConnection = false;
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

    if (this.connectionService.anonymousConnection) {
      this.connectionService.loggedInUser.alias = this.web3service.connectedAccount.slice(2, 6);
      this.connectionService.loggedInUser.uid = null;
      this.makerOrderService.listenForOrders();
      this.messageService.startListeningForMessages();
      this.initializedPage = true;
    } else {
      // check if I have unreceived messages
      // and start listening for messages from others
      this.tokenService.getCustomTokenListFromDB(); // load custom token list from firebase
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
    this.dialog.open(DialogTosComponent, {
        data: { showConsent: false }
    });
  }

  openDonate() {
    this.dialog.open(DonateComponent, {
    });
  }

  openAbout() {
    this.dialog.open(AboutComponent, {
    });
  }

  enterWithoutRegistration() {
    // const dialogRef = this.dialog.open(DialogEnterWithoutRegisterComponent, {
    //   width: '400px'
    // });
    // dialogRef.afterClosed().toPromise()
    // .then(result => {
    //   if (result) {
    //
    //   }
    // });
    if (this.connectionService.web3Connected && this.connectionService.wsConnected) {
      this.connectionService.anonymousConnection = true;
      this.finalizeInitialization();
    }
  }
}
