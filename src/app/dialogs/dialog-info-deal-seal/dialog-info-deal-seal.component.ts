import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-info-deal-seal',
  templateUrl: './dialog-info-deal-seal.component.html',
  styleUrls: ['./dialog-info-deal-seal.component.scss']
})
export class DialogInfoDealSealComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogInfoDealSealComponent>,
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
