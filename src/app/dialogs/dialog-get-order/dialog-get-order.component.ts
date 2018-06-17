import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';

import { WebsocketService } from '../../services/websocket.service';



@Component({
  selector: 'app-dialog-get-order',
  templateUrl: './dialog-get-order.component.html',
  styleUrls: ['./dialog-get-order.component.scss']
})
export class DialogGetOrderComponent implements OnInit {
  public makerAmount: string;

  public foundIntents: any[] = [];
  public orderResponses: any[] = [];
  public websocketSubscription: Subscription;


  constructor(
    public dialogRef: MatDialogRef<DialogGetOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public wsService: WebsocketService,
  ) { }

  ngOnInit() {
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

  stringIsValidNumber(x: string): boolean {
    return Number(x) >= 0;
  }

  makerHasEnough(): boolean {
    return (parseFloat(this.makerAmount) <=
      (this.data.makerBalanceMakerToken / this.data.makerDecimals));
  }

  getOrder(): void {
    if (Number(this.makerAmount) >= 0 && this.makerHasEnough()) {
      this.onCloseConfirm(Math.round(parseFloat(this.makerAmount) * this.data.makerDecimals));
    }
  }
}
