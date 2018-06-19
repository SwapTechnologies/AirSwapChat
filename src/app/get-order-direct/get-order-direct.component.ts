import { Component, OnInit } from '@angular/core';

import { AirswapdexService } from '../services/airswapdex.service';
import { ConnectionService } from '../services/connection.service';
import { MessagingService } from '../services/messaging.service';
import { TokenService, EtherAddress } from '../services/token.service';
import { Erc20Service } from '../services/erc20.service';
import { TakerOrderService } from '../services/taker-order.service';

import { Token } from '../types/types';

@Component({
  selector: 'app-get-order-direct',
  templateUrl: './get-order-direct.component.html',
  styleUrls: ['./get-order-direct.component.scss']
})
export class GetOrderDirectComponent implements OnInit {

  public makerToken: Token;
  public takerToken: Token;
  public makerAmount: number;

  public makerTokenName;
  public filteredValidatedMakerTokens;
  public filteredCustomMakerTokens;
  public takerTokenName;
  public filteredValidatedTakerTokens;
  public filteredCustomTakerTokens;

  public makerBalanceMakerToken;
  public takerBalanceMakerToken;
  public makerBalanceTakerToken;
  public takerBalanceTakerToken;

  public takerTakerTokenApproval = 0;
  public makerDecimals;
  public takerDecimals;
  public makerIsValid: boolean;
  public takerIsValid: boolean;
  public sentRequest: string;


  constructor(
    private airswapDexService: AirswapdexService,
    private connectionService: ConnectionService,
    public messagingService: MessagingService,
    public tokenService: TokenService,
    private erc20Service: Erc20Service,
    private takerOrderService: TakerOrderService,
  ) { }

  ngOnInit() {
    this.filteredValidatedMakerTokens = this.tokenService.validatedTokens;
    this.filteredCustomMakerTokens = this.tokenService.customTokens;
    this.filteredValidatedTakerTokens = this.tokenService.validatedTokens;
    this.filteredCustomTakerTokens = this.tokenService.customTokens;
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

    const helper_makerToken = this.tokenService.getTokenAndWhetherItsValidByName(this.makerTokenName);
    if (helper_makerToken && helper_makerToken.token) {
      this.makerToken = helper_makerToken.token;
      this.makerIsValid = helper_makerToken.isValid;
      this.makerDecimals = 10 ** this.makerToken.decimals;
      this.fetchMakerTokenBalances();
      this.sentRequest = '';
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

    // const token = this.tokenService.getTokenByName(this.takerTokenName);
    const helper_takerToken = this.tokenService.getTokenAndWhetherItsValidByName(this.takerTokenName);
    if (helper_takerToken && helper_takerToken.token) {
      this.takerToken = helper_takerToken.token;
      this.takerIsValid = helper_takerToken.isValid;
      this.takerDecimals = 10 ** this.takerToken.decimals;
      this.fetchTakerTokenBalances();
      if (this.takerToken.address !== EtherAddress) {
        this.checkApproval()
        .then(approvalAmount => {
          this.takerTakerTokenApproval = approvalAmount;
        });
      } else {
        this.takerTakerTokenApproval = 1e25;
      }
      this.sentRequest = '';
    }
  }

  filterEther(token: any) {
    return token.address !== EtherAddress;
  }

  makerHasEnough(): boolean {
    return (this.makerAmount
      && this.erc20Service.toFixed(this.makerAmount * this.makerDecimals) <= this.makerBalanceMakerToken);
  }

  isPositive(): boolean {
    return this.makerAmount > 0;
  }

  getOrder() {
    if (this.makerToken && this.takerToken && this.isPositive() && this.makerHasEnough()) {
      const order = {
        makerAddress: this.messagingService.selectedPeer.peerDetails.address,
        makerAmount: this.erc20Service.toFixed(this.makerAmount * this.makerDecimals),
        makerToken: this.makerToken.address,
        takerToken: this.takerToken.address,
        takerAddress: this.connectionService.loggedInUser.address,
        peer: this.messagingService.selectedPeer.peerDetails,
        alias: this.messagingService.selectedPeer.peerDetails.alias,
        makerProps: this.makerToken,
        takerProps: this.takerToken,
        makerDecimals: this.makerDecimals,
        takerDecimals: this.takerDecimals,
        makerValid: this.makerIsValid,
        takerValid: this.takerIsValid,
        bothTokensValid: this.makerIsValid && this.takerIsValid
      };
      this.takerOrderService.sendGetOrder(order);
      this.sentRequest = order['sentRequest'];
      // this.responseMessage = 'Asking peer how much ' + this.takerToken.symbol +
      //             ' he wants for ' + this.makerAmount + ' ' + this.makerToken.symbol;
      // this.makerToken = undefined;
      // this.takerToken = undefined;
      this.makerAmount = undefined;
    }
  }

  fetchMakerTokenBalances(): void {
    this.erc20Service.balance(this.makerToken.address, this.messagingService.selectedPeer.peerDetails.address)
    .then(balance => {
      this.makerBalanceMakerToken = balance;
    })
    .catch(error =>
      console.log('Error fetching the balance of ' + this.messagingService.selectedPeer.peerDetails.address +
        ' for contract ' + this.makerToken.address)
      );

    this.erc20Service.balance(this.makerToken.address, this.connectionService.loggedInUser.address)
    .then(balance => {
      this.takerBalanceMakerToken = balance;
    })
    .catch(error =>
      console.log('Error fetching the balance of ' + this.connectionService.loggedInUser.address +
        ' for contract ' + this.makerToken.address)
      );
  }

  fetchTakerTokenBalances(): void {
    this.erc20Service.balance(this.takerToken.address, this.messagingService.selectedPeer.peerDetails.address)
    .then(balance => {
      this.makerBalanceTakerToken = balance;
    })
    .catch(error =>
      console.log('Error fetching the balance of ' + this.messagingService.selectedPeer.peerDetails.address +
        ' for contract ' + this.takerToken.address)
      );

    this.erc20Service.balance(this.takerToken.address, this.connectionService.loggedInUser.address)
    .then(balance => {
      this.takerBalanceTakerToken = balance;
    })
    .catch(error =>
      console.log('Error fetching the balance of ' + this.connectionService.loggedInUser.address +
        ' for contract ' + this.takerToken.address)
      );
  }

  checkApproval(): Promise<any> {
    const contract = this.erc20Service.getContract(this.takerToken.address);
    return this.erc20Service.approvedAmount(contract,  this.airswapDexService.airswapDexAddress);
  }

  approveTakerToken() {
    const contract = this.erc20Service.getContract(this.takerToken.address);
    this.erc20Service.approve(contract, this.airswapDexService.airswapDexAddress)
    .then(result => {
      this.checkApproval();
    })
    .catch(error => {
      console.log('Approve failed.');
    });
  }
}
