import { Component, OnInit, NgZone } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  public connectionInfo: string = '';
  public connected: boolean = false;
  public correctNetwork: boolean = false;
  public connectedNetwork: string = '';
  public connectedAccount: string = '';
  public accountBalance: number;
  public timer: any;

  constructor(private web3service: ConnectWeb3Service,
              private zone: NgZone) { }

  ngOnInit() {
    this.connectionInfo = 'Connecting...'
    
    this.timer = TimerObservable.create(0, 20000)
    .subscribe( () => this.checkConnection())
  }

  checkConnection(): void {
    this.web3service.isConnected()
    .then(connected => {
      this.connected = connected;
      if(connected) {
        this.zone.run(() => {
          this.connectionInfo = 'Connected to ' + this.web3service.connected_to;
        })
        this.web3service.getNetworkId().then(network => {
          this.zone.run(() => {
            this.connectedNetwork = network;
            if(network == 'Mainnet') this.correctNetwork = true;
          })
        })
        return this.getAccountInformation()
      }
    })
  }
  getAccountInformation(): Promise<any> {
    return this.web3service.getAccount()
    .then(account => {
      this.zone.run(() => this.connectedAccount = account)
      return this.web3service.getBalance(account);
    }).then((balance) => {
      this.zone.run(() => this.accountBalance = balance)
      return
    }).catch(() => {})
  }

}
