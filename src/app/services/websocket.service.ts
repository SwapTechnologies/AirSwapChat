import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { ConnectWeb3Service } from './connectWeb3.service'

declare var require: any;
const uuidv4 = require('uuid/v4');

@Injectable()
export class WebsocketService {
  public ws: WebSocket;
  public websocketSubject: Subject<string>;


  private url: string = 'wss://sandbox.airswap-api.com/websocket'; //rinkeby
  // private url: string = 'wss://connect.airswap-api.com/websocket'; //mainnet
  private indexerAddress: string = '0x0000000000000000000000000000000000000000';
  public connectionEstablished: boolean = false;
  
  constructor(private web3service: ConnectWeb3Service) {}

  public initSocket(): void {
    this.ws = new WebSocket(this.url);
    this.websocketSubject = new Subject<string>();
    this.ws.onmessage = (event) => this.websocketSubject.next(event.data);
    this.ws.onerror = (event) => this.websocketSubject.error(event);
    this.ws.onclose = (event) => this.websocketSubject.complete();
  }

  public send(message: string): void {
    this.ws.send(message);
  }

  public setConnectionEstablished(_connectionEstablished:boolean): void {
    this.connectionEstablished = _connectionEstablished;
  }

  sendRPC(jsonrpc, receiver): void {
    let envelope = {
      'sender': this.web3service.connectedAccount.toLowerCase(),
      'receiver': receiver.toLowerCase(),
      'message': JSON.stringify(jsonrpc)
    }
    let request: string = JSON.stringify(envelope)
    // console.log('sent request:\n' + request +'\n')
    this.send(request)
  }

  getIntents(address): string {
    let callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g,'');;

    // Construct the `getOrder` query
    let jsonrpc = {
        'id': callId,
        'jsonrpc': '2.0',
        'method': 'getIntents',
        'params': {
          "address": address.toLocaleLowerCase()
        },
    }
    this.sendRPC(jsonrpc, this.indexerAddress);
    return callId;
  }

  setIntents(intents: any[]): string {
    // this.openSetIntents = true;
    let callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g,'');;
    let jsonrpc = {
        'id': callId,
        'jsonrpc': '2.0',
        'method': 'setIntents',
        'params': {
            "address": this.web3service.connectedAccount.toLocaleLowerCase(),
            "intents": intents
        },
    }

    this.sendRPC(jsonrpc, this.indexerAddress)
    return callId;
  }


  getOrder(makerAddress: string, makerAmount: string, makerToken: string,
           takerToken: string, takerAddress: string): void {
    let callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g,'');;
    let jsonrpc = {
        'id': callId,
        'jsonrpc': '2.0',
        'method': 'getOrder',
        'params': {
          "makerAmount": makerAmount,
          "makerToken": makerToken,
          "takerToken": takerToken,
          "takerAddress": takerAddress
        },
    }
    this.sendRPC(jsonrpc, makerAddress)
    return callId
  }

  findIntents(makerTokens, takerTokens): string {
    let callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g,'');;

    let jsonrpc = {
      'id': callId,
      'jsonrpc': '2.0',
      'method': 'findIntents',
      'params': {
        "makerTokens": makerTokens,
        "takerTokens": takerTokens,
        "role": []
      },
    }
    this.sendRPC(jsonrpc, this.indexerAddress);
    return callId;
  }

  sendMessage(receiver, message, time): void {
    let callId = uuidv4().replace(/[^a-zA-Z 0-9]+/g,'');;
    let jsonrpc = {
      'id': callId,
      'jsonrpc': '2.0',
      'method': 'message',
      'params': {
        "message": message,
        "timestamp": time
      },
    }
    this.sendRPC(jsonrpc, receiver)
    return callId;
  }

  sendMessageAnswer(receiver, uuid): void {
    let jsonrpc = {
      'id': uuid,
      'jsonrpc': '2.0',
      'method': 'messageAnswer',
      'params': {
        "message": 'received'
      },
    }
    this.sendRPC(jsonrpc, receiver)
    return uuid;
  }

  sendOrder(receiver, order, uuid): void {
    let jsonrpc = {
      'id': uuid,
      'jsonrpc': '2.0',
      'method': 'orderResponse',
      'result': order,
    }
    this.sendRPC(jsonrpc, receiver)
    return uuid;
  }

  // getMyIntents(): void {
  //   this.getIntents(this.web3service.connectedAccount);
  // }
}