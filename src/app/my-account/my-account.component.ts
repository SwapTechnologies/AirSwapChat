import { Component, OnInit } from '@angular/core';

import { ConnectionService } from '../services/connection.service';
import { FirebaseService } from '../services/firebase.service';
import { WebsocketService } from '../services/websocket.service';


@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent implements OnInit {

  public wantsToChangeAlias = false;
  public newAlias: string;
  public buttonVerb = 'CHANGE';

  public errorMessage = '';

  constructor(
    public connectionService: ConnectionService,
    public firebaseService: FirebaseService,
    private wsService: WebsocketService,
  ) { }

  ngOnInit() {
  }

  changeAlias(): void {
    if (this.wantsToChangeAlias) {
      this.acceptAliasChange();
    } else {
      this.newAlias = this.connectionService.loggedInUser.alias;
      this.wantsToChangeAlias = true;
      this.buttonVerb = 'SET';
    }
  }

  acceptAliasChange(): void {
    this.firebaseService.updateName(this.newAlias);
    this.wantsToChangeAlias = false;
    this.buttonVerb = 'CHANGE';

  }

  logOut(): void {
    this.firebaseService.logOffUser();
    this.wsService.closeConnection();
  }

  deleteMe(): void {
    this.firebaseService.deleteUser()
    .then(() => {
      this.wsService.closeConnection();
    })
    .catch(error => {
      if (error.code && error.code === 'auth/requires-recent-login') {
        this.errorMessage = 'Your last login is too long back. ' +
          'Please logoff + login again if you want to delete your account.';
      }
    });
  }
}
