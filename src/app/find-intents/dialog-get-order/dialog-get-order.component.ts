import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject, Subscription } from 'rxjs/Rx';

import { FindIntentsComponent } from '../find-intents.component';

import { ConnectWeb3Service } from '../../services/connectWeb3.service';
import { GetOrderService } from '../../services/get-order.service';
import { WebsocketService } from '../../services/websocket.service';
import { AirswapdexService } from '../../services/airswapdex.service';

import { EthereumTokensSN, getTokenByAddress } from '../../services/tokens';

import { Token } from '../../types/types';

@Component({
  selector: 'app-dialog-get-order',
  templateUrl: './dialog-get-order.component.html',
  styleUrls: ['./dialog-get-order.component.scss']
})
export class DialogGetOrderComponent implements OnInit {
  public receiver: string;
  public makerAmount: string;

  public tokenList: any[] = EthereumTokensSN;
  public foundIntents: any[] = [];
  public orderResponses: any[] = [];
  public websocketSubscription: Subscription;
  

  constructor(
    public dialogRef: MatDialogRef<DialogGetOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private getOrderService: GetOrderService,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    private airswapDexService: AirswapdexService
  ) { }

  ngOnInit() {
    this.receiver = this.data.address;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onCloseConfirm(uuid: string) {
    this.dialogRef.close(uuid);
  }

  onCloseCancel() {
    this.dialogRef.close();
  }

  getTokenName(token: string): number {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).name
    else
      return null
  }

  getTokenDecimals(token: string): number {
    if(getTokenByAddress(token))
      return 10**(getTokenByAddress(token).decimals)
    else
      return null
  }
  
  getTokenSymbol(token: string): string {
    if(getTokenByAddress(token))
      return getTokenByAddress(token).symbol
    else
      return null
  }

  stringIsValidNumber(x: string): boolean {
    return Number(x) >= 0;
  }
  
  getOrder():void {
    if(this.web3service.web3.utils.isAddress(this.receiver) 
    && Number(this.makerAmount) >= 0) {

      let makerProps = getTokenByAddress(this.data.makerToken);
      let takerProps = getTokenByAddress(this.data.takerToken);
      
      let makerDecimals = 10**makerProps.decimals;
      let makerAmount = Math.floor(Number(this.makerAmount)*makerDecimals);
      if(makerAmount < this.data.peerBalanceMakerToken) {
        let uuid = this.getOrderService.sendGetOrder({
          makerAddress: this.receiver,
          takerAddress: this.web3service.connectedAccount.toLowerCase(),
          makerAmount: makerAmount.toString(),
          makerToken: this.data.makerToken,
          takerToken: this.data.takerToken,
          makerProps: makerProps,
          takerProps: takerProps,
          makerDecimals: makerDecimals,
        })
        this.onCloseConfirm(uuid);
      }
    }
  }
}
