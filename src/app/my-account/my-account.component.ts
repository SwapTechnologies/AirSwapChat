import { Component, OnInit } from '@angular/core';

import { ConnectionService } from '../services/connection.service';
import { FirebaseService } from '../services/firebase.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog } from '@angular/material';
import { DialogYesNoComponent } from '../dialogs/dialog-yes-no/dialog-yes-no.component';

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
    const dialogRef = this.dialog.open(DialogYesNoComponent, {
      width: '400px',
      data: {
        text: 'This will erase you permanently from the database and your peer list will be lost afterwards. Are you sure?',
        yes: 'DELETE ME',
        no: 'CANCEL',
        yesColor: 'warn',
        noColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(isSure => {
      if (isSure) {
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
    });
  }
}
