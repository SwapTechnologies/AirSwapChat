import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'app-dialog-send-offline',
  templateUrl: './dialog-send-offline.component.html',
  styleUrls: ['./dialog-send-offline.component.scss']
})
export class DialogSendOfflineComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogSendOfflineComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

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
