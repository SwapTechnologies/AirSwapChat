import { Component, OnInit, NgZone } from '@angular/core';
import { ConnectWeb3Service } from './services/connectWeb3.service';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private web3service: ConnectWeb3Service,
              private zone: NgZone) { }

  ngOnInit() {
   
  }
}
