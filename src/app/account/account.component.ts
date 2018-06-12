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

  public timer: any;

  constructor(
    public web3service: ConnectWeb3Service,
    public connectionService: ConnectionService ,
  ) { }

  ngOnInit() {
    this.timer = TimerObservable.create(0, 3000);
    this.timer.subscribe( () => this.web3service.checkConnection());
  }

  ngOnDestroy() {
    if (this.timer) {
      this.timer.unsubscribe();
    }
  }
}
