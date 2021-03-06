import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

// services
import { AirswapdexService } from '../services/airswapdex.service';
import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { ConnectionService } from '../services/connection.service';
import { Erc20Service } from '../services/erc20.service';
import { MessagingService } from '../services/messaging.service';
import { NotificationService} from '../services/notification.service';

import { TakerOrderService } from '../services/taker-order.service';
import { TokenService, EtherAddress } from '../services/token.service';
import { UserOnlineService } from '../services/user-online.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog } from '@angular/material';
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

  public selectedTokenName;
  public selectedToken: any;
  public selectedRole = 'maker';

  public foundIntents: any[] = [];
  public displayIntents: any[] = [];

  public clickedApprove: any = {};

  public stillLoading = false;

  public pageSize = 6;
  public pageIndex = 0;

  public filteredValidatedTokens = [];
  public filteredCustomTokens = [];

  constructor(
    private airswapDexService: AirswapdexService,
    public columnSpaceObserver: ColumnSpaceObserverService,
    public connectionService: ConnectionService,
    private erc20services: Erc20Service,
    private messageService: MessagingService,
    public takerOrderService: TakerOrderService,
    public tokenService: TokenService,
    private userOnlineService: UserOnlineService,
    public wsService: WebsocketService,
    public dialog: MatDialog,
    private notifierService: NotificationService,
    ) { }

  ngOnInit() {
    this.filteredValidatedTokens = this.tokenService.validatedTokens;
    if (!this.connectionService.anonymousConnection) {
      this.tokenService.getCustomTokenListFromDB()
      .then(tokenList => {
        this.filteredCustomTokens = tokenList;
      });
    }
  }

  ngOnDestroy() {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
  }

  get columnNumber(): number {
    const columnNum = this.columnSpaceObserver.columnNum;
    const numMessages = this.displayIntents.length;
    return numMessages < 3 ? Math.min(columnNum, numMessages) : columnNum;
  }

  enteredTokenName(): void {
    this.filteredValidatedTokens = this.tokenService.validatedTokens.filter(x => {
      return x.name.toLowerCase().includes(this.selectedTokenName.toLowerCase())
      || x.symbol.toLowerCase().includes(this.selectedTokenName.toLowerCase());
    });
    if (this.tokenService.customTokens) {
      this.filteredCustomTokens = this.tokenService.customTokens.filter(x => {
        return x.name.toLowerCase().includes(this.selectedTokenName.toLowerCase())
        || x.symbol.toLowerCase().includes(this.selectedTokenName.toLowerCase());
      });
    }

    const token = this.tokenService.getTokenByName(this.selectedTokenName);
    if (token) {
      this.selectedToken = token;
      this.showIntents();
    }
  }

  /**
   * Send request to websocket for a specific token and load the answer
   * into foundIntents
   */
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
          // this.foundIntents = this.foundIntents.filter(x => {
          //   return (x.address !== this.connectionService.loggedInUser.address);
          // });

          this.makerTokens = [];
          this.takerTokens = [];
          this.websocketSubscription.unsubscribe();

          if (this.foundIntents.length > 0
              && this.pageIndex * this.pageSize + 1 > this.foundIntents.length) {
            this.pageIndex = Math.floor((this.foundIntents.length - 1) / this.pageSize);
          } else if (this.foundIntents.length === 0) {
            this.pageIndex = 0;
          }
          this.updateDisplayedIntents();
        }
      });
    }
  }

  /**
   * Triggered when set paginator is changed
   * @param event includes current pageIndex etc.
   */
  page(event) {
    this.pageIndex = event.pageIndex;
    this.updateDisplayedIntents();
  }

  updateDisplayedIntents() {
    this.displayIntents = this.foundIntents.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize); // get only the first pageSize intents to check

    this.getTokenProperties();
    this.checkAllApprovals();
    this.fetchBalances();
    this.checkPeerData();
  }

  getTokenProperties(): void {
    for (const intent of this.displayIntents) {
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

  checkAllApprovals(): void {
    for (const intent of this.displayIntents) {
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

  fetchBalances(): void {
    for (const intent of this.displayIntents) {
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

  approveTaker(intent: any): void {
    this.clickedApprove[intent['takerToken']] = true;
    const contract = this.erc20services.getContract(intent.takerToken);
    this.erc20services.approve(contract, this.airswapDexService.airswapDexAddress)
    .then(result => {
      intent.approvedTakerToken = this.erc20services.toFixed(1e21 * 10 ** intent.takerProps.decimals);
      this.checkAllApprovals();
    })
    .catch(error => {
      console.log('Approve failed.');
      this.clickedApprove[intent['takerToken']] = false;
    });
  }

  checkPeerData(): Promise<any> {
    if (this.connectionService.anonymousConnection) {
      for (const intent of this.displayIntents) {
        const peerAddress = intent['address'];

        intent['peer'] = {
          alias: peerAddress.slice(2, 6),
          address: peerAddress,
          uid: null,
          inMyPeerList: false
        };
      }
      Promise.resolve(true);
    } else {
      const checkedUser = {}; // users you are already checking async
      const promiseList = [];
      const deferredIntents = []; // multiple intents from checkedUser

      for (const intent of this.displayIntents) {
        const peerAddress = intent['address'];
        if (checkedUser[peerAddress]) {
          deferredIntents.push(intent);
          continue;
        } // else
        checkedUser[peerAddress] = true;

        // check if user was already seen at any point earlier, if no add his details
        // otherwise load old data, fails if user is not in database
        promiseList.push(
          this.userOnlineService.addUserFromFirebaseByAddress(peerAddress)
          .then(peer => {
            intent['peer'] = peer;
          })
        );
      }
      return Promise.all(promiseList)
      .then(() => {
        for (const intent of deferredIntents) {
          const peerAddress = intent['address'];
          const peer = this.userOnlineService.getUserByAddress(peerAddress);
          intent['peer'] = peer;
        }
      });
    }
  }

  message(intent: any): void {
    this.messageService.getPeerAndAddByAddress(intent.peer.address)
    .then(peer => {
      this.messageService.selectedPeer = peer;
      this.messageService.showMessenger = true;
    });
  }

  openDialogGetOrder(intent: any): void {
    const selectedRole = this.selectedRole;
    const dialogRef = this.dialog.open(DialogGetOrderComponent, {
      width: '500px',
      data: {
        intent: intent,
        selectedRole: selectedRole
      }
    });

    dialogRef.afterClosed().subscribe(amount => {
      if (amount) {
        if (selectedRole === 'maker') {
          const order = {
            makerAddress: intent.address,
            makerAmount: this.erc20services.toFixed(amount),
            makerToken: intent.makerToken,
            takerToken: intent.takerToken,
            takerAddress: this.connectionService.loggedInUser.address,
            peer: intent.peer,
            alias: intent.peer.alias,
            makerProps: intent.makerProps,
            takerProps: intent.takerProps,
            makerDecimals: intent.makerDecimals,
            takerDecimals: intent.takerDecimals,
            makerValid: intent.makerValid,
            takerValid: intent.takerValid,
            bothTokensValid: intent.bothTokensValid
          };
          this.takerOrderService.sendGetOrder(order);
        } else if (selectedRole === 'taker') {
          const order = {
            makerAddress: intent.address,
            makerToken: intent.makerToken,
            takerToken: intent.takerToken,
            takerAddress: this.connectionService.loggedInUser.address,
            takerAmount: this.erc20services.toFixed(amount),
            peer: intent.peer,
            alias: intent.peer.alias,
            makerProps: intent.makerProps,
            takerProps: intent.takerProps,
            makerDecimals: intent.makerDecimals,
            takerDecimals: intent.takerDecimals,
            makerValid: intent.makerValid,
            takerValid: intent.takerValid,
            bothTokensValid: intent.bothTokensValid
          };
          this.takerOrderService.sendGetOrder(order);
        }
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
        this.refreshTokens();
      }
    });
  }

  refreshIntents(): void {
    this.showIntents();
  }

  refreshTokens(): void {
    this.tokenService.getCustomTokenListFromDB();
  }

  clearTokenName(): void {
    this.selectedTokenName = '';
    this.enteredTokenName();
  }
}
