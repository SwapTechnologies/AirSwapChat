import { Component, Inject, OnInit, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-tos',
  templateUrl: './dialog-tos.component.html',
  styleUrls: ['./dialog-tos.component.scss']
})
export class DialogTosComponent implements OnInit {

  public checkStoreData = false;
  public checkToS = false;

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
    this.dialogRef.close(this.checkStoreData && this.checkToS);
  }

  onCloseCancel() {
    this.dialogRef.close(false);
  }
}
