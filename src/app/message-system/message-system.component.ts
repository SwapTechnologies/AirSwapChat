import { Component, OnInit, OnDestroy } from '@angular/core';

// services
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { MessagingService } from '../services/messaging.service';
import { UserOnlineService } from '../services/user-online.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog } from '@angular/material';
import { DialogAddPeerComponent } from './dialog-add-peer/dialog-add-peer.component';

import { TimerObservable } from 'rxjs/observable/TimerObservable';
import {MatSnackBar} from '@angular/material';

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
    private userOnlineService: UserOnlineService,
    public wsService: WebsocketService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
  ) { }

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
    // this.messageService.checkOnlineStatusOfPeerList();
  }

  openDialogAddPeer() {
    const dialogRef = this.dialog.open(DialogAddPeerComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (this.web3service.web3.utils.isAddress(result)) {
        this.firebaseService.getUserUid(result)
        .then((uid) => {
          if (uid) {
            this.messageService.getPeerAndAdd(uid)
            .then(peer => {
              this.messageService.selectedPeer = peer;
            });
          } else {
            this.snackBar.open('Entered address ' +
            result +
            ' is not registered with AirSwapChat', 'Sad...', {duration: 5000});
          }
        });
      } else {
        this.snackBar.open('Entered invalid address', 'Oops.', {duration: 3000});
      }
    });
  }

  sendMessage(): void {
    if (this.message && this.message.trim().length > 0
        && !this.messageService.sendingMessage) {
      this.messageService.sendMessage(this.message.trim());
      this.message = '';
    }
  }

  addPeerAsFriend(): void {
    if (this.messageService.selectedPeer && this.messageService.selectedPeer.peerDetails.uid) {
      this.firebaseService.addPeerAsFriend(this.messageService.selectedPeer.peerDetails.uid);
      this.userOnlineService.setPeerToFriend(this.messageService.selectedPeer.peerDetails.uid);
    }
  }
}
