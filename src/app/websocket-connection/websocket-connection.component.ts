import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subject, Subscription } from 'rxjs/Rx';

import { WebsocketService } from '../services/websocket.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
import { MessagingService } from '../services/messaging.service';
import { OrderRequestsService } from '../services/order-requests.service';

import { Erc20Service } from '../services/erc20.service';
import { AirswapdexService } from '../services/airswapdex.service';
import { EthereumTokensSN, getTokenByAddress } from '../services/tokens';


@Component({
  selector: 'app-websocket-connection',
  templateUrl: './websocket-connection.component.html',
  styleUrls: ['./websocket-connection.component.css']
})
export class WebsocketConnectionComponent implements OnInit, OnDestroy {
  
  private websocketSubject: Subject<string>;
  private websocketSubscriptions: any = {};


  constructor(
    public web3service: ConnectWeb3Service,
    private messageService: MessagingService,
    public orderService: OrderRequestsService,
    public wsService: WebsocketService,
    private erc20service: Erc20Service,
    private airswapDexService: AirswapdexService
  ) { }
  
  ngOnInit() { 
    for(let token of EthereumTokensSN) {
      if(token.address === '0x0000000000000000000000000000000000000000')
        continue
      // console.log(token);
      let contract = this.erc20service.getContract(token.address);
      
      this.erc20service
      .approvedAmount(contract, this.airswapDexService.airswapDexAddress)
      .then(approvedAmount => {
        if(Number(approvedAmount) === 0) {
          this.erc20service.approve(contract, this.airswapDexService.airswapDexAddress);
        }
      })
    }
  }

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
          

          
          this.messageService.startMessenger(); // start listening for chatter
          this.listenForOrders();
        } else {
          console.log('Got unexpected message before handshake:' + message);
        }
      })
    )
  }
  
  handshake(message): Promise<any> {
    return (
      this.web3service.web3.eth.personal
      .sign(message, this.web3service.connectedAccount)
      .then((signedMessage) => {
        this.wsService.send(signedMessage);
      })
    )
  }

  listenForOrders(): void {
    // start a listener that looks for messages
    this.websocketSubscriptions['listenForOrders'] = 
    this.wsService.websocketSubject
    .subscribe(message => {
      let receivedMessage = JSON.parse(message);
      let content = JSON.parse(receivedMessage['message'])
      let method = content['method']
      if (method === 'getOrder'){
        let uuid = content['id'];
        let makerAddress = receivedMessage['receiver'];
        let makerAmount = content['params']['makerAmount'];
        let makerToken = content['params']['makerToken'];
        let takerToken = content['params']['takerToken'];
        let takerAddress= content['params']['takerAddress'];

        let newOrder = {
          makerAddress: makerAddress,
          makerAmount: makerAmount,
          makerToken: makerToken,
          takerToken: takerToken,
          takerAddress: takerAddress,
          id: uuid
        }
        this.orderService.addOrder(newOrder)
      }
    })
  }
  
  idleListening(): void {
    // let idle listening run in background
    this.websocketSubscriptions['idleListening'] = 
    this.wsService.websocketSubject
    .subscribe(message => {
      let receivedMessage = JSON.parse(message);
      let content = JSON.parse(receivedMessage['message'])
      let method = content['method']
      console.log('Got message:')
      console.log(receivedMessage);
    });
  }
}