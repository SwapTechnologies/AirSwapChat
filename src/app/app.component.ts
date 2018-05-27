import { Component, OnInit } from '@angular/core';
import { ConnectWeb3Service } from './services/connectWeb3.service';
import { WebsocketService } from './services/websocket.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(public web3service: ConnectWeb3Service,
              public wsService: WebsocketService) { }

  ngOnInit() {
   
  }
}
