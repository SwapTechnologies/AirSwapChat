import { Component, OnInit } from '@angular/core';

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

  constructor(
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

  filterEther(token: any) {
    return token.address !== EtherAddress;
  }
  stringIsValidNumber(makerAmount): boolean {
    return Number(this.makerAmount) >= 0;
  }
  getOrder() {
    if (Number(this.makerAmount) >= 0 && this.makerToken && this.takerToken) {

      const makerDecimal = 10 ** this.makerToken.decimals;
      const order = {
        makerAddress: this.messagingService.selectedPeer.peerDetails.address,
        makerAmount: this.erc20Service.toFixed(Math.floor(Number(this.makerAmount) * makerDecimal)),
        makerToken: this.makerToken.address,
        takerToken: this.takerToken.address,
        takerAddress: this.connectionService.loggedInUser.address
      };
      console.log('sending', order);
      const uuid = this.getOrderService.sendGetOrder(order);

      this.makerToken = undefined;
      this.takerToken = undefined;
      this.makerAmount = undefined;
    }
  }
}
