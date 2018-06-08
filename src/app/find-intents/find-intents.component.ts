import { Lexer } from '@angular/compiler';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { Subscription } from 'rxjs/Subscription';

// services
import { AirswapdexService } from '../services/airswapdex.service';
import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { ConnectionService } from '../services/connection.service';
import { Erc20Service } from '../services/erc20.service';
import { FirebaseService } from '../services/firebase.service';
import { MessagingService } from '../services/messaging.service';
import { GetOrderService } from '../services/get-order.service';
import { TokenService, EtherAddress } from '../services/token.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog, MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material';
import { DialogGetOrderComponent } from '../dialogs/dialog-get-order/dialog-get-order.component';
import { DialogAddTokenComponent } from '../dialogs/dialog-add-token/dialog-add-token.component';

@Component({
  selector: 'app-find-intents',
  templateUrl: './find-intents.component.html',
  styleUrls: ['./find-intents.component.scss']
})
export class FindIntentsComponent implements OnInit, OnDestroy {

  public websocketSubscription: Subscription;

  public makerTokens: string[] = [];
  public takerTokens: string[] = [];

  public selectedToken: any;
  public selectedRole = 'maker';

  public foundIntents: any[] = [];

  public clickedApprove: any = {};

  public stillLoading = false;
  constructor(
    private airswapDexService: AirswapdexService,
    public columnSpaceObserver: ColumnSpaceObserverService,
    private connectionService: ConnectionService,
    private erc20services: Erc20Service,
    private firebaseService: FirebaseService,
    private messageService: MessagingService,
    public getOrderService: GetOrderService,
    public tokenService: TokenService,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    public dialog: MatDialog,
    ) { }

  ngOnInit() {
    this.tokenService.getCustomTokenList();
  }

  ngOnDestroy() {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
  }

  showIntents(): void {
    this.makerTokens = [];
    this.takerTokens = [];
    if (this.selectedToken && this.selectedRole) {
      if (this.selectedRole === 'maker') {
        this.makerTokens.push(this.selectedToken.address.toLowerCase());
      } else if (this.selectedRole === 'taker') {
        this.takerTokens.push(this.selectedToken.address.toLowerCase());
      }
    }
    if (this.makerTokens.length > 0 || this.takerTokens.length > 0) {
      const uuid = this.wsService.findIntents(this.makerTokens, this.takerTokens);
      this.websocketSubscription = this.wsService.websocketSubject
      .subscribe(message => {
        const parsedMessage = JSON.parse(message);
        const parsedContent = JSON.parse(parsedMessage['message']);
        const id = parsedContent['id'];
        if (id === uuid) {
          this.foundIntents = parsedContent['result'];

          // only show intents of tokens known to us
          this.foundIntents = this.foundIntents.filter(x => {
            if (this.tokenService.getToken(x.makerToken) && this.tokenService.getToken(x.takerToken)) {
              return true;
            } else {
              return false;
            }
          });

          // only show intents that are not made by myself
          this.foundIntents = this.foundIntents.filter(x => {
            return (x.address !== this.connectionService.loggedInUser.address);
          });
          this.stillLoading = true;
          this.makerTokens = [];
          this.takerTokens = [];
          this.websocketSubscription.unsubscribe();

          this.getTokenProperties();
          this.checkAllApprovals();
          this.fetchBalances();
          this.checkOnlineStatus();
        }
      });
    }
  }

  getExponential(exponent: number): number {
    return 10 ** exponent;
  }

  checkAllApprovals(): void {
    for (const intent of this.foundIntents) {
      const takerToken = intent['takerToken'];
      if (takerToken !== EtherAddress) {
        this.checkApproval(takerToken)
        .then(approvedAmount => {
          intent['approvedTakerToken'] = approvedAmount;
          this.clickedApprove[intent['takerToken']] = false;
        });
      } else {
        intent['approvedTakerToken'] = 1e25;
      }
    }
  }

  getTokenProperties(): void {
    for (const intent of this.foundIntents) {
      const makerToken = intent['makerToken'];
      const takerToken = intent['takerToken'];
      const helper_makerToken = this.tokenService.getTokenAndWhetherItsValid(makerToken);
      const helper_takerToken = this.tokenService.getTokenAndWhetherItsValid(takerToken);
      intent['makerValid'] = helper_makerToken.isValid;
      intent['takerValid'] = helper_takerToken.isValid;
      intent['bothTokensValid'] = helper_makerToken.isValid && helper_takerToken.isValid;
      intent['makerProps'] = helper_makerToken.token;
      intent['takerProps'] = helper_takerToken.token;
      intent['makerDecimals'] = 10 ** intent.makerProps.decimals;
      intent['takerDecimals'] = 10 ** intent.takerProps.decimals;
    }
  }

  fetchBalances(): void {
    for (const intent of this.foundIntents) {
      const peerAddress = intent['address'];
      const makerToken = intent['makerToken'];
      const takerToken = intent['takerToken'];

      this.erc20services.balance(makerToken, peerAddress)
      .then(balance => {
        intent['makerBalanceMakerToken'] = balance;
      })
      .catch(error =>
        console.log('Error fetching the balance of ' + peerAddress +
          ' for contract ' + makerToken));

      this.erc20services.balance(takerToken, peerAddress)
      .then(balance => {
        intent['makerBalanceTakerToken'] = balance;
      })
      .catch(error =>
        console.log('Error fetching the balance of ' + peerAddress +
          ' for contract ' + takerToken));

      this.erc20services.balance(makerToken, this.connectionService.loggedInUser.address)
      .then(balance => {
        intent['takerBalanceMakerToken'] = balance;
      })
      .catch(error =>
        console.log('Error fetching the balance of ' +
          this.connectionService.loggedInUser.address +
          ' for contract ' + makerToken));

      this.erc20services.balance(takerToken, this.connectionService.loggedInUser.address)
      .then(balance => {
        intent['takerBalanceTakerToken'] = balance;
      })
      .catch(error =>
        console.log('Error fetching the balance of ' +
          this.connectionService.loggedInUser.address +
          ' for contract ' + takerToken));
    }
  }

  checkApproval(address: string): Promise<any> {
    const contract = this.erc20services.getContract(address);
    return this.erc20services.approvedAmount(contract,  this.airswapDexService.airswapDexAddress);
  }

  stringIsValidNumber(x: string): boolean {
    return Number(x) > 0;
  }

  approveTaker(intent: any): void {
    this.clickedApprove[intent['takerToken']] = true;
    const contract = this.erc20services.getContract(intent.takerToken);
    this.erc20services.approve(contract, this.airswapDexService.airswapDexAddress)
    .then(result => {
      this.checkAllApprovals();
    })
    .catch(error => {
      console.log('Approve failed.');
      this.clickedApprove[intent['takerToken']] = false;
    });
  }

  checkOnlineStatus(): void {
    const PromiseList = [];
    const subscriptions = [];

    for (const intent of this.foundIntents) {
      const peerAddress = intent['address'];
      let uid;
      PromiseList.push(
        this.firebaseService.getUserUid(peerAddress)
        .then(userUid => {
          uid = userUid;
          intent['uid'] = uid;
          if (uid) {
            return this.firebaseService.getUserAlias(uid);
          } else {
            return peerAddress.slice(2, 6);
          }
        }).then(alias => {
          intent['alias'] = alias;
          if (uid) {
            return this.firebaseService.getUserOnline(uid);
          } else {
            return false;
          }
        }).then(isOnline => {
          intent['isOnline'] = isOnline;
        })
      );
    }

    // const delayPromise = new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     resolve(false);
    //   }, 2000);
    // });

    // Promise.race([Promise.all(PromiseList), delayPromise])
    Promise.all(PromiseList)
    .then((onlineStatus) => {
      for (const subscription of subscriptions) {
        subscription.unsubscribe();
      }
      this.foundIntents = this.foundIntents.sort((a: any, b: any) => {
        return (a.isOnline === b.isOnline) ? 0 : a.isOnline ? -1 : 1;
      });
      this.stillLoading = false;
    })
    .catch(error => {
      console.log('Failed retrieving online status of peers');
    });
  }

  message(intent: any): void {
    this.messageService.getPeerAndAdd(intent.uid)
    .then(peer => {
      this.messageService.selectedPeer = peer;
      this.messageService.showMessenger = true;
    });
  }

  openDialogGetOrder(intent: any): void {
    const dialogRef = this.dialog.open(DialogGetOrderComponent, {
      width: '500px',
      data: intent
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        intent['sentRequest'] = result;
      }
    });
  }

  filterEther(token: any) {
    return token.address !== EtherAddress;
  }

  addToken(): void {
    const dialogRef = this.dialog.open(DialogAddTokenComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refresh();
      }
    });
  }

  refresh(): void {
    this.tokenService.getCustomTokenList()
    .then(() => {
      this.showIntents();
    });
  }
}
