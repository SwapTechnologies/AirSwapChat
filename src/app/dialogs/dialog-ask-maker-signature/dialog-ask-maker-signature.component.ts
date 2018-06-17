import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-ask-maker-signature',
  templateUrl: './dialog-ask-maker-signature.component.html',
  styleUrls: ['./dialog-ask-maker-signature.component.scss']
})
export class DialogAskMakerSignatureComponent implements OnInit {

  public suggestedTakerAmount;
  public deviation;

  constructor(
    public dialogRef: MatDialogRef<DialogAskMakerSignatureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.suggestedTakerAmount = this.data.order['UsdPrices'].makerToken / this.data.order['UsdPrices'].takerToken *
                          this.data.order.makerAmount / this.data.order.makerDecimals;
    const setTakerAmount = this.data.order.takerAmount / this.data.order.takerDecimals;
    console.log(this.suggestedTakerAmount, setTakerAmount);
    this.deviation = (this.suggestedTakerAmount - setTakerAmount) / setTakerAmount;
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onCloseConfirm() {
    this.dialogRef.close(true);
  }

  onCloseCancel() {
    this.dialogRef.close(false);
  }
}
