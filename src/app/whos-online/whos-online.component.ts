import { Component, OnInit } from '@angular/core';

import {MatTableDataSource} from '@angular/material';

import { WhosOnlineService } from '../services/whos-online.service';
import { MessagingService } from '../services/messaging.service';

@Component({
  selector: 'app-whos-online',
  templateUrl: './whos-online.component.html',
  styleUrls: ['./whos-online.component.scss']
})
export class WhosOnlineComponent implements OnInit {

  constructor(
    public whoOnlineService: WhosOnlineService,
    private messageService: MessagingService,
  ) { }

  ngOnInit() {
  }

  message(user: any) {
    let peer = this.messageService.getPeerAndAdd(
      user.address);
    this.messageService.selectedPeer = peer;
    this.messageService.showMessenger = true;
  }
}