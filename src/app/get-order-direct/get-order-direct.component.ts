import { Component, OnInit } from '@angular/core';

import { AirswapdexService } from '../services/airswapdex.service';
import { ConnectionService } from '../services/connection.service';
import { MessagingService } from '../services/messaging.service';
import { TokenService, EtherAddress } from '../services/token.service';
import { Erc20Service } from '../services/erc20.service';
import { GetOrderService } from '../services/get-order.service';

import { Token } from '../types/types';

@Component({
  selector: 'app-get-order-direct',
  templateUrl: './get-order-direct.component.html',
  styleUrls: ['./get-order-direct.component.scss']
})
export class GetOrderDirectComponent implements OnInit {

  public makerToken: Token;
  public takerToken: Token;
  public makerAmount: string;

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

  public responseMessage: string;


  constructor(
    private airswapDexService: AirswapdexService,
    private connectionService: ConnectionService,
    public messagingService: MessagingService,
    public tokenService: TokenService,
    private erc20Service: Erc20Service,
    private getOrderService: GetOrderService,
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

    const token = this.tokenService.getTokenByName(this.makerTokenName);
    if (token) {
      this.makerToken = token;
      this.makerDecimals = 10 ** this.makerToken.decimals;
      this.fetchMakerTokenBalances();
      this.responseMessage = '';
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
      this.responseMessage = '';
    }
  }

  filterEther(token: any) {
    return token.address !== EtherAddress;
  }
  stringIsValidNumber(makerAmount): boolean {
    return Number(this.makerAmount) >= this.makerBalanceMakerToken / this.makerDecimals;
  }
  getOrder() {
    if (Number(this.makerAmount) >= 0 && this.makerToken && this.takerToken) {

      const order = {
        makerAddress: this.messagingService.selectedPeer.peerDetails.address,
        makerAmount: this.erc20Service.toFixed(Math.floor(Number(this.makerAmount) * this.makerDecimals)),
        makerToken: this.makerToken.address,
        takerToken: this.takerToken.address,
        takerAddress: this.connectionService.loggedInUser.address
      };
      console.log('sending', order);
      const uuid = this.getOrderService.sendGetOrder(order);
      this.responseMessage = 'Asking peer how much ' + this.takerToken.symbol +
                  ' he wants for ' + this.makerAmount + ' ' + this.makerToken.symbol;
      this.makerToken = undefined;
      this.takerToken = undefined;
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
