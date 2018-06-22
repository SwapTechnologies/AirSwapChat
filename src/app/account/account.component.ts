import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { ConnectionService } from '../services/connection.service';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {

  constructor(
    public web3service: ConnectWeb3Service,
    public connectionService: ConnectionService ,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
