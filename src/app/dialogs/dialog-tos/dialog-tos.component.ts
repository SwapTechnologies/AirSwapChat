import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-tos',
  templateUrl: './dialog-tos.component.html',
  styleUrls: ['./dialog-tos.component.scss']
})
export class DialogTosComponent implements OnInit {

  public checkStoreData = false;
  public checkToS = false;
  public receiveEmailNotifications = false;

  constructor(
    public dialogRef: MatDialogRef<DialogTosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onCloseConfirm() {
    this.dialogRef.close({
      consent: this.checkStoreData && this.checkToS,
      emailNotifications: this.receiveEmailNotifications});
  }

  onCloseCancel() {
    this.dialogRef.close(false);
  }
}
