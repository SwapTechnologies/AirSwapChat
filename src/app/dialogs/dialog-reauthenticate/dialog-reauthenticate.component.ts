import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { auth } from 'firebase/app';
@Component({
  selector: 'app-dialog-reauthenticate',
  templateUrl: './dialog-reauthenticate.component.html',
  styleUrls: ['./dialog-reauthenticate.component.scss']
})
export class DialogReauthenticateComponent implements OnInit {

  public password: string;
  public mailAddress;

  constructor(
    public dialogRef: MatDialogRef<DialogReauthenticateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private firebaseService: FirebaseService,
    private afAuth: AngularFireAuth,
  ) { }

  ngOnInit() {
    const user = this.firebaseService.user;
    this.mailAddress = user.email;
  }

  onNoClick(): void {
    this.dialogRef.close(null);
  }

  onCloseCancel() {
    this.dialogRef.close(null);
  }

  reauthenticate() {
    const credential = auth.EmailAuthProvider.credential(this.mailAddress, this.password);
    this.dialogRef.close(credential);
  }
}
