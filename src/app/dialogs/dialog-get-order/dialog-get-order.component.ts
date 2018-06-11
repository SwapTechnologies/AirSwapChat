import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';

import { ConnectWeb3Service } from '../../services/connectWeb3.service';
import { GetOrderService } from '../../services/get-order.service';
import { TokenService } from '../../services/token.service';
import { WebsocketService } from '../../services/websocket.service';



@Component({
  selector: 'app-dialog-get-order',
  templateUrl: './dialog-get-order.component.html',
  styleUrls: ['./dialog-get-order.component.scss']
})
export class DialogGetOrderComponent implements OnInit {
  public receiver: string;
  public makerAmount: string;

  public foundIntents: any[] = [];
  public orderResponses: any[] = [];
  public websocketSubscription: Subscription;


  constructor(
    public dialogRef: MatDialogRef<DialogGetOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private getOrderService: GetOrderService,
    private tokenService: TokenService,
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
  ) { }

  ngOnInit() {
    this.receiver = this.data.address;
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
    if (this.web3service.web3.utils.isAddress(this.receiver)
    && Number(this.makerAmount) >= 0 && this.makerHasEnough()) {
      this.onCloseConfirm(Math.round(parseFloat(this.makerAmount) * this.data.makerDecimals));
    }
  }
}
