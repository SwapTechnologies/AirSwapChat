import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-yes-no',
  templateUrl: './dialog-yes-no.component.html',
  styleUrls: ['./dialog-yes-no.component.scss']
})
export class DialogYesNoComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogYesNoComponent>,
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
