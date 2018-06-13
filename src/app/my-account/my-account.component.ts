import { Component, OnInit } from '@angular/core';

import { ConnectionService } from '../services/connection.service';
import { FirebaseService } from '../services/firebase.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog } from '@angular/material';
import { DialogReauthenticateComponent } from '../dialogs/dialog-reauthenticate/dialog-reauthenticate.component';

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
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
  }

  changeAlias(): void {
    if (this.wantsToChangeAlias) {
      if (this.newAlias.trim() !== '') {
        this.acceptAliasChange();
      }
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
    const dialogRef = this.dialog.open(DialogReauthenticateComponent, {
      width: '400px',
      data: {
        text: 'This will erase you permanently from the database and your peer list will be lost afterwards. ' +
              'Enter your password again to proceed.',
      }
    });

    dialogRef.afterClosed().subscribe(credentials => {
      if (credentials) {
        this.firebaseService.deleteUser(credentials)
        .then(() => {
          if (!this.connectionService.firebaseConnected) {
            this.wsService.closeConnection();
          }
        })
        .catch(error => {
          if (error.code && error.code === 'auth/requires-recent-login') {
            this.errorMessage = 'Your last login is too long back. ' +
              'Please logoff + login again if you want to delete your account.';
          }
        });
      }
    });
  }
}
