import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { WebsocketService } from '../services/websocket.service';

import { Subject, Subscription } from 'rxjs/Rx';

type Message = {
  user: string;
  message: string;
}

@Component({
  selector: 'app-message-system',
  templateUrl: './message-system.component.html',
  styleUrls: ['./message-system.component.css']
})
export class MessageSystemComponent implements OnInit, OnDestroy {

  private websocketSubscription: any = {};
  public isOpen: boolean = false;

  public receiver: string = '';
  public message: string = '';

  public messageList: Message[] = [];

  constructor(
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if(this.websocketSubscription) this.websocketSubscription.unsubscribe;
  }

  startMessenger(): void {
    this.websocketSubscription = this.wsService.websocketSubject
    .subscribe(message => {
      let receivedMessage = JSON.parse(message);
      let content = JSON.parse(receivedMessage['message'])
      let method = content['method']
      if (method === 'message'){
        this.messageList.unshift({
          user: receivedMessage['sender'],
          message: content['params']['message']
        })
      }
    })
    this.isOpen = true;
  }
  sendMessage(): void {
    this.wsService.sendMessage(this.receiver, this.message)
    this.messageList.unshift({
      user: this.web3service.connectedAccount,
      message: this.message
    })
  }
  
}
