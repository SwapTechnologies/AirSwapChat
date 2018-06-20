import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dialog-enter-without-register',
  templateUrl: './dialog-enter-without-register.component.html',
  styleUrls: ['./dialog-enter-without-register.component.scss']
})
export class DialogEnterWithoutRegisterComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogEnterWithoutRegisterComponent>,
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