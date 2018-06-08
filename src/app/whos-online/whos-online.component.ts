import { Component, OnInit } from '@angular/core';

import {MatTableDataSource} from '@angular/material';

import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { MessagingService } from '../services/messaging.service';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-whos-online',
  templateUrl: './whos-online.component.html',
  styleUrls: ['./whos-online.component.scss']
})
export class WhosOnlineComponent implements OnInit {

  constructor(
    public columnSpaceObserver: ColumnSpaceObserverService,
    public firebaseService: FirebaseService,
    private messageService: MessagingService,
  ) { }

  ngOnInit() {
    this.refresh();
  }

  message(user: any) {
    this.messageService.getPeerAndAdd(user.uid)
    .then((peer) => {
      this.messageService.selectedPeer = peer;
      this.messageService.showMessenger = true;
    });
  }

  refresh(): void {
    if (Date.now() - this.firebaseService.lastTimeLoadedUserList > 60000) {
      this.firebaseService.readUserList();
    }
  }
}
