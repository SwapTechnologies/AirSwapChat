import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';

import { Erc20Service } from '../../services/erc20.service';
import { WebsocketService } from '../../services/websocket.service';



@Component({
  selector: 'app-dialog-get-order',
  templateUrl: './dialog-get-order.component.html',
  styleUrls: ['./dialog-get-order.component.scss']
})
export class DialogGetOrderComponent implements OnInit {
  public makerAmount: number;

  public foundIntents: any[] = [];
  public orderResponses: any[] = [];
  public websocketSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DialogGetOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public wsService: WebsocketService,
    private erc20service: Erc20Service
  ) { }

  ngOnInit() {
    console.log(this.data.makerBalanceMakerToken);
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onCloseConfirm(makerAmount) {
    this.dialogRef.close(makerAmount);
  }

  onCloseCancel() {
    this.dialogRef.close(false);
  }

  makerHasEnough(): boolean {
    return (this.erc20service.toFixed(this.makerAmount * this.data.makerDecimals) <= this.data.makerBalanceMakerToken);
  }

  isPositive(): boolean {
    return (this.makerAmount >= 0);
  }

  getOrder(): void {
    if (this.makerAmount && this.isPositive() && this.makerHasEnough()) {
      this.onCloseConfirm(this.erc20service.toFixed(this.makerAmount * this.data.makerDecimals));
    }
  }
}
