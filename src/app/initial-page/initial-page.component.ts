import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebsocketConnectionComponent } from '../websocket-connection/websocket-connection.component';

@Component({
  selector: 'app-initial-page',
  templateUrl: './initial-page.component.html',
  styleUrls: ['./initial-page.component.scss']
})
export class InitialPageComponent implements OnInit {

  constructor(
  ) { }

  ngOnInit(): void {
    
  }

  ngOnDestroy(): void {
    
  }
}
