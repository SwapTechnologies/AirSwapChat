import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-info-order-offer',
  templateUrl: './dialog-info-order-offer.component.html',
  styleUrls: ['./dialog-info-order-offer.component.scss']
})
export class DialogInfoOrderOfferComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogInfoOrderOfferComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
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
