import { Component, OnInit } from '@angular/core';

import {MatTableDataSource} from '@angular/material';

import { MessagingService } from '../services/messaging.service';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-whos-online',
  templateUrl: './whos-online.component.html',
  styleUrls: ['./whos-online.component.scss']
})
export class WhosOnlineComponent implements OnInit {

  constructor(
    public firebaseService: FirebaseService,
    private messageService: MessagingService,
  ) { }

  ngOnInit() {
  }

  message(user: any) {
    this.messageService.getPeerAndAdd(user.address)
    .then((peer) => {
      this.messageService.selectedPeer = peer;
      this.messageService.showMessenger = true;
    });
  }
}
