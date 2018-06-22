import { Component, ViewChild, QueryList, ViewChildren, ElementRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// services
import { ConnectionService } from '../services/connection.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { FirebaseService } from '../services/firebase.service';
import { MessagingService } from '../services/messaging.service';
import { NotificationService} from '../services/notification.service';
import { UserOnlineService } from '../services/user-online.service';
import { WebsocketService } from '../services/websocket.service';

import { MatDialog, MatInput } from '@angular/material';
import { DialogAddPeerComponent } from './dialog-add-peer/dialog-add-peer.component';

import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-message-system',
  templateUrl: './message-system.component.html',
  styleUrls: ['./message-system.component.scss']
})
export class MessageSystemComponent implements OnInit, AfterViewInit, OnDestroy {

  public message = ''; // text entered in message box
  public timer: any;
  private enableScrollDown = false;
  @ViewChild('scrollMe') public myScrollContainer: ElementRef;
  @ViewChildren('messagesContainer') public myMessagesContainer: QueryList<any>;

  constructor(
    private connectionService: ConnectionService,
    private web3service: ConnectWeb3Service,
    public messageService: MessagingService,
    private firebaseService: FirebaseService,
    private userOnlineService: UserOnlineService,
    public wsService: WebsocketService,
    public dialog: MatDialog,
    private notifierService: NotificationService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.timer = TimerObservable.create(0, 1000)
    .subscribe( () => this.updateStatus());

    if (this.messageService.selectedPeer &&
      !this.messageService.selectedPeer.peerDetails.online &&
      !this.messageService.selectedPeer.hasUnreadMessages) {
        // current peer is offline... do I have unread messages?
        for (const peer of this.messageService.connectedPeers) {
          if (peer.hasUnreadMessages) {
            this.messageService.selectedPeer = peer;
            break;
           }
        }
        // no unread messages... anybody online?
        for (const peer of this.messageService.connectedPeers) {
          if (peer.peerDetails.online) {
            this.messageService.selectedPeer = peer;
            break;
           }
        }
        // well.. then no
      }
  }

  ngAfterViewInit() {
    if (this.myMessagesContainer) {
      this.myMessagesContainer.changes.subscribe(this.scrollToBottom);
    }
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
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (this.web3service.web3.utils.isAddress(result)) {
        if (this.connectionService.anonymousConnection) {
          this.messageService.getPeerAndAddByAddress(result)
          .then(peer => {
            this.messageService.selectedPeer = peer;
          });
        } else {
          this.firebaseService.getUserUid(result)
          .then((uid) => {
            if (uid) {
              this.messageService.getPeerAndAdd(uid)
              .then(peer => {
                this.messageService.selectedPeer = peer;
              });
            } else {
              this.notifierService.showMessage('Entered address ' +
              result + ' is not registered with AirSwapChat');
              this.messageService.getPeerAndAddByAddress(result)
              .then(peer => {
                this.messageService.selectedPeer = peer;
              });
            }
          });
        }
      } else {
        this.notifierService.showMessage('Entered invalid address');
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
  removePeerAsFriend(): void {
    if (this.messageService.selectedPeer && this.messageService.selectedPeer.peerDetails.uid) {
      this.firebaseService.removePeerAsFriend(this.messageService.selectedPeer.peerDetails.uid);
      this.userOnlineService.removePeerAsFriend(this.messageService.selectedPeer.peerDetails.uid);
    }
  }

  initGetOrderWithSelectedPeer(): void {
    this.router.navigate(['getOrder']);
  }

  scrollToBottom = () => {
    if (this.myScrollContainer === undefined) {
      return;
    }
    try {
      const element = this.myScrollContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) { }
  }

}
