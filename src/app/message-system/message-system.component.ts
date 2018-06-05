import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';

// services
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { MessagingService } from '../services/messaging.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog } from '@angular/material';
import { DialogAddPeerComponent } from './dialog-add-peer/dialog-add-peer.component';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

import { Message, Peer } from '../types/types';

@Component({
  selector: 'app-message-system',
  templateUrl: './message-system.component.html',
  styleUrls: ['./message-system.component.scss']
})
export class MessageSystemComponent implements OnInit, OnDestroy {

  public message = ''; // text entered in message box

  public timer: any;

  constructor(
    private web3service: ConnectWeb3Service,
    public messageService: MessagingService,
    private firebaseService: FirebaseService,
    public wsService: WebsocketService,
    private zone: NgZone,
    private db: AngularFireDatabase,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.timer = TimerObservable.create(0, 5000)
    .subscribe( () => this.updateStatus());
  }

  ngOnDestroy() {
    if (this.timer) {
      this.timer.unsubscribe();
    }
  }

  updateStatus(): void {
    if (this.messageService.selectedPeer) {
      this.messageService.setMessageRead();
    }
    this.messageService.checkOnlineStatus();
  }

  openDialogAddPeer() {
    const dialogRef = this.dialog.open(DialogAddPeerComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (this.web3service.web3.utils.isAddress(result)) {
        this.firebaseService.getUserDetailsFromAddress(result)
        .then(userDetails => {
          return this.messageService.getPeerAndAdd(result, userDetails);
        }).then(peer => {
          this.messageService.selectedPeer = peer;
        });
      } else { console.log('Entered invalid address.'); }
    });
  }

  sendMessage(): void {
    if (this.message.length > 0) {
      this.messageService.sendMessage(this.message);
      this.message = '';
    }
  }
}
