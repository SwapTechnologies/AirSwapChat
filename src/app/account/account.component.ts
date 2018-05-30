import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { WebsocketService } from '../services/websocket.service';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit, OnDestroy {

  public connected: boolean = false;
  public correctNetwork: boolean = false;
  public accountConnected: boolean = false;

  public timer: any;

  constructor(private web3service: ConnectWeb3Service,
              private wsService: WebsocketService,
              private zone: NgZone) { }

  ngOnInit() {   
    this.timer = TimerObservable.create(0, 3000);
    this.timer.subscribe( () => this.checkConnection());
  }
  
  ngOnDestroy() {
    if(this.timer)
      this.timer.unsubscribe();
  }

  checkConnection(): void {
    //check if connection to web3 is available via web3
    this.web3service.isConnected()
    .then(connected => { 
      this.zone.run( () => this.connected = connected);
      if(connected) { // generally a connection available?
        return this.web3service.getNetworkId()
      } else {
        return null;
      }
    })
    .then(network => {
      // is it connected to the correct network?
      this.zone.run(() => 
        this.correctNetwork = (network === this.web3service.desiredNetwork)
      );
      return this.web3service.getAccount()
    }).then(account => {
      // is an account connected?
      if(account && this.wsService.loggedInUser) {
        if(account.toLowerCase() !== this.wsService.loggedInUser.address) {
          this.wsService.connectionEstablished = false;
        }
      }
      this.zone.run(() => this.accountConnected = account !== undefined);

    }).catch((error) => {console.log('Error while checking connection.')})
  }
}
