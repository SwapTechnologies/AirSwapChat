import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { environment } from '../../environments/environment';

import { ConnectWeb3Service } from './connectWeb3.service';
import { OrderRequestsService } from '../services/order-requests.service';
import { ConnectionService } from './connection.service';

declare var require: any;
const uuidv4 = require('uuid/v4');

@Injectable()
export class WebsocketService {
  public ws: WebSocket;
  public websocketSubject: Subject<string>;
  private websocketSubscriptions: any = {};

  private url = environment.ethereumNetwork.websocketUrl;
  private indexerAddress = '0x0000000000000000000000000000000000000000';
  public performingHandshake = false;
  public infoMessage = '';

  constructor(
    private web3service: ConnectWeb3Service,
    private connectionService: ConnectionService,
    private orderRequestsService: OrderRequestsService,
  ) {}

  public initSocket(): Promise<boolean> {
    this.ws = new WebSocket(this.url);
    this.websocketSubject = new Subject<string>();
    this.ws.onmessage = (event) => this.websocketSubject.next(event.data);
    this.ws.onerror = (event) => {
      console.log('Websocket has thrown an error.');
      this.connectionService.wsConnected = false;
      this.websocketSubject.error(event);
    };
    this.ws.onclose = (event) => {
      console.log('Websocket connection has closed.');
      this.connectionService.wsConnected = false;
      this.websocketSubject.complete();
    };

    // handshake
    return new Promise((resolve, reject) => {
      this.websocketSubscriptions['handshake'] = (
        this.websocketSubject
        .subscribe(message => {
          if (message.startsWith(
          'By signing this message, I am proving that I control the selected ' +
          'account for use on the AirSwap trading network.')) {
            this.infoMessage = 'Sign in Metamask that you are in control of your account.';
            this.handshake(message);
          } else if (message === 'ok') {
            console.log('Handshake accepted');
            this.websocketSubscriptions['handshake'].unsubscribe();

            this.connectionService.loggedInUser.wsAddress = this.web3service.connectedAccount.toLowerCase();
            this.connectionService.wsConnected = true;

            this.listenForOrders();
            resolve(true);

          } else {
            console.log('Got unexpected message before handshake finished:' + message);
            this.websocketSubscriptions['handshake'].unsubscribe();
            resolve(false);
          }
        })
      );
    });
  }

  closeConnection(): void {
    this.ws.close();
  }

  public send(message: string): void {
    this.ws.send(message);
  }

  handshake(message): Promise<any> {
    this.performingHandshake = true;
    return (
      this.web3service.web3.eth.personal
      .sign(message, this.web3service.connectedAccount)
      .then((signedMessage) => {
        this.send(signedMessage);
        this.performingHandshake = false;
      })
      .catch(error => {
        this.infoMessage = 'Handshake failed.';
        this.performingHandshake = false;
      })
    );
  }

  listenForOrders(): void {
    // start a listener that looks for messages
    this.websocketSubscriptions['listenForOrders'] =
    this.websocketSubject
    .subscribe(message => {
      const receivedMessage = JSON.parse(message);
      const content = JSON.parse(receivedMessage['message']);
      const method = content['method'];
      if (method === 'getOrder') {
        const uuid = content['id'];
        const makerAddress = receivedMessage['receiver'];
        const makerAmount = content['params']['makerAmount'];
        const makerToken = content['params']['makerToken'];
        const takerToken = content['params']['takerToken'];
        const takerAddress = content['params']['takerAddress'];

        const newOrder = {
          makerAddress: makerAddress,
          makerAmount: makerAmount,
          makerToken: makerToken,
          takerToken: takerToken,
          takerAddress: takerAddress,
          id: uuid
        };
        this.orderRequestsService.addOrder(newOrder);
      }
    });
  }

  // idleListening(): void {
  //   this.websocketSubscriptions['idleListening'] =
  //   this.websocketSubject
  //   .subscribe(message => {
  //     const receivedMessage = JSON.parse(message);
  //     const content = JSON.parse(receivedMessage['message']);
  //     const method = content['method'];
  //   });
  // }

  sendRPC(jsonrpc, receiver): void {
    const envelope = {
      'sender': this.web3service.connectedAccount.toLowerCase(),
      'receiver': receiver.toLowerCase(),
      'message': JSON.stringify(jsonrpc)
    };
    const request: string = JSON.stringify(envelope);
    this.send(request);
  }

  getIntents(address: string): string {
    const callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g, '');
    // Construct the `getOrder` query
    const jsonrpc = {
        'id': callId,
        'jsonrpc': '2.0',
        'method': 'getIntents',
        'params': {
          'address': address.toLowerCase()
        },
    };
    this.sendRPC(jsonrpc, this.indexerAddress);
    return callId;
  }

  setIntents(intents: any[]): string {
    const callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g, '');
    const jsonrpc = {
        'id': callId,
        'jsonrpc': '2.0',
        'method': 'setIntents',
        'params': {
            'address': this.web3service.connectedAccount.toLowerCase(),
            'intents': intents
        },
    };

    this.sendRPC(jsonrpc, this.indexerAddress);
    return callId;
  }


  getOrder(makerAddress: string, makerAmount: string, makerToken: string,
           takerToken: string, takerAddress: string): string {
    const callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g, '');
    const jsonrpc = {
        'id': callId,
        'jsonrpc': '2.0',
        'method': 'getOrder',
        'params': {
          'makerAmount': makerAmount,
          'makerToken': makerToken,
          'takerToken': takerToken,
          'takerAddress': takerAddress
        },
    };
    this.sendRPC(jsonrpc, makerAddress);
    return callId;
  }

  findIntents(makerTokens, takerTokens): string {
    const callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g, '');

    const jsonrpc = {
      'id': callId,
      'jsonrpc': '2.0',
      'method': 'findIntents',
      'params': {
        'makerTokens': makerTokens,
        'takerTokens': takerTokens,
        'role': []
      },
    };
    this.sendRPC(jsonrpc, this.indexerAddress);
    return callId;
  }

  sendMessage(receiver, message, time): string {
    const callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g, '');
    const jsonrpc = {
      'id': callId,
      'jsonrpc': '2.0',
      'method': 'message',
      'params': {
        'message': message,
        'timestamp': time
      },
    };
    this.sendRPC(jsonrpc, receiver);
    return callId;
  }

  sendMessageAnswer(receiver, uuid): string {
    const jsonrpc = {
      'id': uuid,
      'jsonrpc': '2.0',
      'method': 'messageAnswer',
      'params': {
        'message': 'received'
      },
    };
    this.sendRPC(jsonrpc, receiver);
    return uuid;
  }

  sendOrder(receiver, order, uuid): string {
    const jsonrpc = {
      'id': uuid,
      'jsonrpc': '2.0',
      'method': 'orderResponse',
      'result': order,
    };
    this.sendRPC(jsonrpc, receiver);
    return uuid;
  }

  // pingPeer(receiver): string {
  //   const callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g, '');
  //   const jsonrpc = {
  //     'id': callId,
  //     'jsonrpc': '2.0',
  //     'method': 'ping'
  //   };
  //   this.sendRPC(jsonrpc, receiver);
  //   return callId;
  // }

  // pongPeer(receiver, uuid): string {
  //   const jsonrpc = {
  //     'id': uuid,
  //     'jsonrpc': '2.0',
  //     'method': 'pong'
  //   };
  //   this.sendRPC(jsonrpc, receiver);
  //   return uuid;
  // }

  // pingAndListenForPong(peerAddress): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     let answered = false;
  //     const uuid = this.pingPeer(peerAddress);
  //     const subscription = this.websocketSubject
  //     .subscribe(message => {
  //       const parsedMessage = JSON.parse(message);
  //       const parsedContent = JSON.parse(parsedMessage['message']);
  //       const id = parsedContent['id'];
  //       if (id === uuid) {
  //         const method = parsedContent['method'];
  //         if (method === 'pong') {
  //           answered = true;
  //           resolve(true);
  //         }
  //         resolve(true);
  //       }
  //     });
  //     setTimeout(() => {
  //       if (!answered) {
  //         resolve(false);
  //       }
  //     }, 2000);
  //   });
  // }

  // getMyIntents(): void {
  //   this.getIntents(this.web3service.connectedAccount);
  // }
}
