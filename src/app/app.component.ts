import { Component, OnInit, OnDestroy } from '@angular/core';

import { FirebaseService } from './services/firebase.service';
import { WebsocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(private firebaseService: FirebaseService,
              private wsService: WebsocketService ) { }

  ngOnInit() {
   
  }

  ngOnDestroy() {
    this.firebaseService.logOffUser(this.wsService.loggedInUser);
    console.log('signing off.')
  }
}
