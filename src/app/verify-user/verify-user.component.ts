import { Component, OnInit } from '@angular/core';

import { FirebaseService } from '../services/firebase.service';
@Component({
  selector: 'app-verify-user',
  templateUrl: './verify-user.component.html',
  styleUrls: ['./verify-user.component.scss']
})
export class VerifyUserComponent implements OnInit {

  public sendMail = false;
  public responseMessage = '';
  constructor(
    private firebaseService: FirebaseService,
  ) { }

  ngOnInit() {
    this.sendVerificationMail();
  }

  sendVerificationMail(): void {
    this.firebaseService.user.sendEmailVerification();
    this.sendMail = true;

    this.responseMessage = 'Follow the link that we sent to ' +
      this.firebaseService.user.email + ' and then log in again';

    setTimeout(() => {
      this.firebaseService.logOffUser();
    }, 10000);
  }

}
