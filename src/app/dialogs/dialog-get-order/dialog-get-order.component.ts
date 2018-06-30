import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';

import { Erc20Service } from '../../services/erc20.service';
import { PriceInfoService } from '../../services/price-info.service';
import { WebsocketService } from '../../services/websocket.service';



@Component({
  selector: 'app-dialog-get-order',
  templateUrl: './dialog-get-order.component.html',
  styleUrls: ['./dialog-get-order.component.scss']
})
export class DialogGetOrderComponent implements OnInit {
  public amount: number;

  public foundIntents: any[] = [];
  public orderResponses: any[] = [];
  public websocketSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DialogGetOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public wsService: WebsocketService,
    private erc20service: Erc20Service,
    private priceInfoService: PriceInfoService
  ) { }

  ngOnInit() {
    this.getTokenPrice();
  }

  getTokenPrice() {
    this.priceInfoService.getPricesOfPair(this.data.intent.makerProps.symbol, this.data.intent.takerProps.symbol)
    .then(priceResult => {
      this.data['UsdPrices'] = priceResult;
    });
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onCloseConfirm(amount) {
    this.dialogRef.close(amount);
  }

  onCloseCancel() {
    this.dialogRef.close(false);
  }

  makerHasEnough(): boolean {
    return (this.erc20service.toFixed(this.amount * this.data.intent.makerDecimals) <= this.data.intent.makerBalanceMakerToken);
  }

  takerHasEnough(): boolean {
    return (this.erc20service.toFixed(this.amount * this.data.intent.takerDecimals) <= this.data.intent.takerBalanceTakerToken);
  }

  isPositiveMakerToken(): boolean {
    return (this.amount >= 1 / this.data.intent.makerDecimals);
  }

  isPositiveTakerToken(): boolean {
    return (this.amount >= 1 / this.data.intent.takerDecimals);
  }

  getOrderMaker(): void {
    if (this.amount && this.isPositiveMakerToken() && this.makerHasEnough()) {
      this.onCloseConfirm(this.erc20service.toFixed(this.amount * this.data.intent.makerDecimals));
    }
  }

  getOrderTaker(): void {
    if (this.amount && this.isPositiveTakerToken() && this.takerHasEnough()) {
      this.onCloseConfirm(this.erc20service.toFixed(this.amount * this.data.intent.takerDecimals));
    }
  }
}
