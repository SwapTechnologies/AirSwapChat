import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

// services
import { AirswapdexService } from '../services/airswapdex.service';
import { ConnectionService } from '../services/connection.service';
import { Erc20Service } from '../services/erc20.service';
import { TokenService, EtherAddress } from '../services/token.service';
import { WebsocketService } from '../services/websocket.service';

import { Token } from '../types/types';

@Component({
  selector: 'app-set-intents',
  templateUrl: './set-intents.component.html',
  styleUrls: ['./set-intents.component.scss']
})
export class SetIntentsComponent implements OnInit, OnDestroy {

  public makerToken: Token;
  public takerToken: Token;

  public myIntents: any[] = [];
  public markedIntents = false;
  public intentsMarkedForRemoval: any;

  public unapprovedTokens: any[] = [];
  public websocketSubscription: Subscription;

  public astBalance = 0;
  public balanceTooLow = true;

  public clickedApprove: any = {};
  public errorMessage = '';
  public showBuyButton = false;
  public initialized = false;

  public makerTokenName;
  public filteredValidatedMakerTokens;
  public filteredCustomMakerTokens;
  public takerTokenName;
  public filteredValidatedTakerTokens;
  public filteredCustomTakerTokens;
  constructor(
    private airswapDexService: AirswapdexService,
    private connectionService: ConnectionService,
    private erc20service: Erc20Service,
    public tokenService: TokenService,
    public wsService: WebsocketService,
  ) { }

  ngOnInit() {
    this.filteredValidatedMakerTokens = this.tokenService.validatedTokens;
    this.filteredCustomMakerTokens = this.tokenService.customTokens;
    this.filteredValidatedTakerTokens = this.tokenService.validatedTokens;
    this.filteredCustomTakerTokens = this.tokenService.customTokens;
    this.initialize();
  }

  initialize() {
    this.getMyIntents()
    .then(() => {
      return this.erc20service.balance(
        this.tokenService.getTokenByName('AirSwap').address,
        this.connectionService.loggedInUser.address);
    }).then(balance => {
      this.astBalance = balance / 1e4;
      this.balanceTooLow = this.astBalance - 250 * this.myIntents.length < 250;
      this.initialized = true;
    });
  }

  enteredMakerTokenName(): void {
    this.filteredValidatedMakerTokens = this.tokenService.validatedTokens.filter(x => {
      return x.name.toLowerCase().includes(this.makerTokenName.toLowerCase())
      || x.symbol.toLowerCase().includes(this.makerTokenName.toLowerCase());
    });
    this.filteredCustomMakerTokens = this.tokenService.customTokens.filter(x => {
      return x.name.toLowerCase().includes(this.makerTokenName.toLowerCase())
      || x.symbol.toLowerCase().includes(this.makerTokenName.toLowerCase());
    });

    const token = this.tokenService.getTokenByName(this.makerTokenName);
    if (token) {
      this.makerToken = token;
    }
  }

  enteredTakerTokenName(): void {
    this.filteredValidatedTakerTokens = this.tokenService.validatedTokens.filter(x => {
      return x.name.toLowerCase().includes(this.takerTokenName.toLowerCase())
      || x.symbol.toLowerCase().includes(this.takerTokenName.toLowerCase());
    });
    this.filteredCustomTakerTokens = this.tokenService.customTokens.filter(x => {
      return x.name.toLowerCase().includes(this.takerTokenName.toLowerCase())
      || x.symbol.toLowerCase().includes(this.takerTokenName.toLowerCase());
    });

    const token = this.tokenService.getTokenByName(this.takerTokenName);
    if (token) {
      this.takerToken = token;
    }
  }

  getMyIntents(): Promise<any> {
    return new Promise((resolve, reject) => {
      const uuid = this.wsService.getIntents(this.connectionService.loggedInUser.address);
      const answerSubscription = this.wsService.websocketSubject
      .subscribe(message => {
        const parsedMessage = JSON.parse(message);
        const parsedContent = JSON.parse(parsedMessage['message']);
        const id = parsedContent['id'];
        if (id === uuid) {
          this.myIntents = parsedContent['result'];
          this.intentsMarkedForRemoval = [];
          this.checkApproval();
          answerSubscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  findIdxOfIntent(intent, intentList): number {
    return intentList.findIndex(x => {
      return (x.makerToken === intent.makerToken
           && x.takerToken === intent.takerToken);
    });
  }

  isIntentInList(intent): any {
    return this.myIntents.find(x => {
      return (x.makerToken === intent.makerToken
           && x.takerToken === intent.takerToken);
    });
  }

  changedList(event): void {
    this.markedIntents = event.length > 0;
  }

  ngOnDestroy() {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
  }

  addTokenPair(): void {
    if (this.makerToken
    && this.takerToken
    && this.makerToken.address !== this.takerToken.address) {
      const intent = {
        'makerToken': this.makerToken.address.toLowerCase(),
        'takerToken': this.takerToken.address.toLowerCase(),
        'role': 'maker'
      };
      if (!this.isIntentInList(intent)) {
        this.myIntents.push(intent);
        this.callSetIntents(this.myIntents);
      }
    }
  }

  tokenSymbol(tokenAddress: string): string {
    const token = this.tokenService.getToken(tokenAddress.toLowerCase());
    if (token) {
      return token.symbol;
    } else {
      return null;
    }
  }

  removeMarkedIntents(): void {
    const newIntentList = JSON.parse(JSON.stringify(this.myIntents));
    // removed marked intents
    for (const intent of this.intentsMarkedForRemoval) {
      const idx = this.findIdxOfIntent(intent, newIntentList);
      if (idx >= 0) {
        newIntentList.splice( idx, 1 );
      }
    }
    this.markedIntents = false;
    this.callSetIntents(newIntentList);
  }

  callSetIntents(intentList): void {
    const sendIntents = [];
    for (const intent of intentList) {
      sendIntents.push({
        makerToken: intent.makerToken,
        takerToken: intent.takerToken,
        role: intent.role,
      });
    }
    const uuid = this.wsService.setIntents(sendIntents);
    this.websocketSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      const parsedMessage = JSON.parse(message);
      const parsedContent = JSON.parse(parsedMessage['message']);
      const id = parsedContent['id'];
      if (id === uuid) {
        this.errorMessage = '';
        const response = parsedContent['result'];
        if (response === 'ok') {
          // this.showBuyButton = false;
          // this.getMyIntents();
        } else {
          if (parsedContent['error']) {
            this.myIntents.splice(-1, 1);
            // this.showBuyButton = true;
            this.errorMessage = parsedContent['error']['message'];
          }
        }
        this.initialize();
        this.websocketSubscription.unsubscribe();
      }
    });
  }

  checkApproval(): void {
    const promiseList = [];
    this.unapprovedTokens = [];
    for (const intent of this.myIntents) {
      const contract = this.erc20service.getContract(intent.makerToken);
      this.clickedApprove[intent.makerToken] = false;
      promiseList.push(
        this.erc20service.approvedAmount(contract,  this.airswapDexService.airswapDexAddress)
        .then(approvedAmount => {
          if (!(approvedAmount > 0)
          && !this.unapprovedTokens.find(x => x === intent.makerToken) ) {
            this.unapprovedTokens.push(intent.makerToken);
          }
        })
      );
    }
  }

  approveMaker(makerToken: string): void {
    this.clickedApprove[makerToken] = true;
    const contract = this.erc20service.getContract(makerToken);
    this.erc20service.approve(contract, this.airswapDexService.airswapDexAddress)
    .then(result => {
      this.checkApproval();
    })
    .catch(error => {
      console.log('Approve failed.');
      this.clickedApprove[makerToken] = false;
    });
  }

  filterEther(token: any) {
    return token.address !== EtherAddress;
  }

  refreshTokens(): void {
    this.tokenService.getCustomTokenListFromDB();
  }

  // buySwap(): void {
  //   window.AirSwap.Trader.render({
  //     env: 'sandbox',
  //     mode: 'buy',
  //     token: this.tokenService.getTokenByName('AirSwap').address,
  //     amount: 2500000,
  //     onCancel: () => {
  //       console.log('Trade was canceled.');
  //     },
  //     onComplete: (transactionId) => {
  //       this.initialize();
  //     }
  //   }, 'body');
  // }
}
