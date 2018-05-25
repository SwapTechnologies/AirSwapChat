import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';

import { Subject, Subscription } from 'rxjs/Rx';
import { WebsocketService } from '../services/websocket.service';


@Component({
  selector: 'app-websocket-connection',
  templateUrl: './websocket-connection.component.html',
  styleUrls: ['./websocket-connection.component.css']
})
export class WebsocketConnectionComponent implements OnInit, OnDestroy {
  
  private websocketSubject: Subject<string>;
  private websocketSubscriptions: any = {};


  constructor(
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService  ) { }

  ngOnInit() {   }

  ngOnDestroy() { 
    for(let subscription in this.websocketSubscriptions) {
      this.websocketSubscriptions[subscription].unsubscribe();
    }
  }

  connectWebsocket() {
    this.wsService.initSocket();
    // handshake
    this.websocketSubscriptions['handshake'] = (
      this.wsService.websocketSubject
      .subscribe(message => {
        if (message.startsWith(
          'By signing this message, I am proving that I control the selected '+
          'account for use on the AirSwap trading network.')) {
          this.handshake(message)
        } else if (message === 'ok') {
          console.log('Handshake accepted')
          this.websocketSubscriptions['handshake'].unsubscribe();
          this.wsService.connectionEstablished = true;
          
          // this.getMyIntents()
          this.websocketSubscriptions['idleListening'] = 
            this.wsService.websocketSubject
            .subscribe(message => {
              let receivedMessage = JSON.parse(message);
              let content = JSON.parse(receivedMessage['message'])
              let method = content['method']
              console.log('Got message:')
              console.log(receivedMessage);
            });
        } else {
          console.log('Got unexpected message before handshake:' + message);
        }
      })
    )
  }
  
  handshake(message): Promise<any> {
    return (
      this.web3service.web3.eth.personal.sign(message,
                                              this.web3service.connectedAccount)
      .then((signedMessage) => {
        this.wsService.send(signedMessage);
      })
    )
  }
}