import { Component, OnInit } from '@angular/core';

import {MatTableDataSource} from '@angular/material';

import { ColumnSpaceObserverService } from '../services/column-space-observer.service';
import { MessagingService } from '../services/messaging.service';
import { ConnectionService } from '../services/connection.service';
import { FirebaseService } from '../services/firebase.service';
import { UserOnlineService } from '../services/user-online.service';

@Component({
  selector: 'app-whos-online',
  templateUrl: './whos-online.component.html',
  styleUrls: ['./whos-online.component.scss']
})
export class WhosOnlineComponent implements OnInit {

  constructor(
    public columnSpaceObserver: ColumnSpaceObserverService,
    public connectionService: ConnectionService,
    public firebaseService: FirebaseService,
    private messageService: MessagingService,
    private userOnlineService: UserOnlineService,
  ) { }

  public pageSize = 6;
  public pageIndex = 0;
  public displayedPeople = [];
  public loadedInitially = false;

  ngOnInit() {
    this.refresh();
  }

  get columnNumber(): number {
    const columnNum = this.columnSpaceObserver.columnNum;
    const numMessages = this.displayedPeople.filter(this.onlyOnline).length;
    return numMessages < 3 ? Math.min(columnNum, numMessages) : columnNum;
  }

  message(user: any) {
    this.messageService.getPeerAndAdd(user.uid)
    .then((peer) => {
      this.messageService.selectedPeer = peer;
      this.messageService.showMessenger = true;
    });
  }

  page(event) {
    this.pageIndex = event.pageIndex;
    this.updateDisplayedPeople();
  }

  refresh(): void {
    if (Date.now() - this.firebaseService.lastTimeLoadedWhosOnline > 10000) {
      const promiseList = [];
      this.firebaseService.readWhosOnline()
      .then(whosOnline => {
        for (const uid in whosOnline) {
          if (whosOnline[uid]) {
            if (uid === this.connectionService.loggedInUser.uid) {
              continue;
            }
            promiseList.push(this.userOnlineService.addUserFromFirebase(uid));
          }
        }
        Promise.all(promiseList)
        .then(() => {
          const whosOnlineUids = Object.keys(this.userOnlineService.users);
          this.firebaseService.whosOnlineList = [];
          for (const uid of whosOnlineUids) {
            if (uid === this.connectionService.loggedInUser.uid) {
              continue;
            }
            this.firebaseService.whosOnlineList.push(this.userOnlineService.users[uid]);
          }
          this.updateDisplayedPeople();
          this.loadedInitially = true;
        });
      });
    }
  }

  updateDisplayedPeople() {
    this.displayedPeople = this.firebaseService.whosOnlineList.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize);
  }

  onlyOnline(user: any) {
    return user.online === true;
  }
}
