import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { MessageSystemComponent } from '../message-system.component';

@Component({
  selector: 'app-dialog-add-peer',
  templateUrl: './dialog-add-peer.component.html',
  styleUrls: ['./dialog-add-peer.component.scss']
})
export class DialogAddPeerComponent implements OnInit {

  public peerAddress = '';

  constructor(
    public dialogRef: MatDialogRef<DialogAddPeerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

  }

  onNoClick(): void {
    this.dialogRef.close('Cancel');
  }

  onCloseConfirm() {
    this.dialogRef.close(this.peerAddress);
  }

  onCloseCancel() {
    this.dialogRef.close('Cancel');
  }

}
