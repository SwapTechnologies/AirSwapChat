import { Component, OnInit } from '@angular/core';

import { FirebaseService } from '../services/firebase.service';
@Component({
  selector: 'app-verify-user',
  templateUrl: './verify-user.component.html',
  styleUrls: ['./verify-user.component.scss']
})
export class VerifyUserComponent implements OnInit {

  public sendMail = false;
  constructor(
    private firebaseService: FirebaseService,
  ) { }

  ngOnInit() {
  }

  sendVerificationMail(): void {
    this.firebaseService.user.sendEmailVerification();
    this.sendMail = true;
  }

}
