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
  public filteredWhosOnline = [];

  ngOnInit() {
    if (!this.connectionService.anonymousConnection) {
      this.refresh();
    }
  }

  get columnNumber(): number {
    const columnNum = this.columnSpaceObserver.columnNum;
    const numMessages = this.displayedPeople.filter(this.onlyOnline).length;
    return numMessages < 3 ? Math.max(1, Math.min(columnNum, numMessages)) : columnNum;
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
      // get list from firebase who's online
      this.firebaseService.readWhosOnline()
      .then(whosOnline => {
        for (const uid in whosOnline) {
          if (whosOnline[uid]) {
            // clean user out of this list
            if (uid === this.connectionService.loggedInUser.uid) {
              continue;
            }
            // fill all those people into your list of peers you observe during your session
            promiseList.push(this.userOnlineService.addUserFromFirebase(uid));
          }
        }
        Promise.all(promiseList)
        .then(() => {
          const whosOnlineUids = Object.keys(this.userOnlineService.users);
          this.firebaseService.whosOnlineList = [];
          // get everybody who is in your list of active peers for his status
          for (const uid of whosOnlineUids) {
            if (uid === this.connectionService.loggedInUser.uid) {
              continue;
            }
            this.firebaseService.whosOnlineList.push(this.userOnlineService.users[uid]);
          }
          this.filteredWhosOnline = [];
          for (const user of this.firebaseService.whosOnlineList) {
            if (user.online) {
              this.filteredWhosOnline.push(user);
            }
          }
          this.updateDisplayedPeople();
          this.loadedInitially = true;
        });
      });
    } else {
      this.filteredWhosOnline = [];
      for (const user of this.firebaseService.whosOnlineList) {
        if (user.online) {
          this.filteredWhosOnline.push(user);
        }
      }
      this.updateDisplayedPeople();
      this.loadedInitially = true;
    }
  }

  updateDisplayedPeople() {
    this.displayedPeople = this.filteredWhosOnline.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize);
  }

  onlyOnline(user: any) {
    return user.online === true;
  }
}
