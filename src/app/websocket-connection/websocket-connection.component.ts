import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subject, Subscription } from 'rxjs/Rx';

import { WebsocketService } from '../services/websocket.service';
import { ConnectWeb3Service } from '../services/connectWeb3.service';
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
    private web3service: ConnectWeb3Service,
    public wsService: WebsocketService,
    private erc20service: Erc20Service,
    private airswapDexService: AirswapdexService
  ) { }
  
  ngOnInit() { 





    // "0xdbd6f75aedebdf1c3d2b7085229450200e410fbb", "21000000000000000000", "0xd423637329111beea0cab5ce3332482fb9d2cad6", "0xc7a1b6c071e114c1cd587182aec6838a179a0a11", "120000", "0xcc1cbd4f67cceb7c001bd4adf98451237a193ff8", "1527456771", "99898279499424", "28", "0x7a752c65135cb3ca7ad0587c34e10ee19d26099b11e8cb7da80697e3b84c0f56", "0x300ad0fbb1668e220b9ba9745b8f02d6b4382754ec41186647431aee22c38b51"


    
    // // "28",
    // // "0xf6ca40fb5646f056a45b8aec7dbe6370b229719f0cef958e2629743f1cf8c168",
    // // "0x3dfa905f26f5d2eabfd7b8b8f5f63d4540accb26eed29b37efd4135de15cf154"
    // let hashV = this.web3service.web3.utils.soliditySha3(
    //   "0xdbd6f75aedebdf1c3d2b7085229450200e410fbb", // order['makerAddress'],
    //   "1230000", // order['makerAmount'],
    //   "0xcc1cbd4f67cceb7c001bd4adf98451237a193ff8", // order['makerToken'],
    //   "0xc7a1b6c071e114c1cd587182aec6838a179a0a11", // order['takerAddress'],
    //   "21000000000000000000", // order['takerAmount'],
    //   "0xd423637329111beea0cab5ce3332482fb9d2cad6", // order['takerToken'],
    //   "1527455042", // order['nonce'],
    //   "113739173806457", // order['expiration']
    // )
    // // 0xDFB7C02B9F15622EC71E7AB283D65B071D64A2E8353CE60A97743C7EAC5310E9
    // // 0xdfb7c02b9f15622ec71e7ab283d65b071d64a2e8353ce60a97743c7eac5310e9

    // // 0x31ECB6E68402DDC209D1633200042463489B27AA2D643293148BAAD13EE8D5DF
    // // 0x31ecb6e68402ddc209d1633200042463489b27aa2d643293148baad13ee8d5df
    // console.log(hashV);
    // let prefixedHash = 
    //   this.web3service.web3.eth.accounts.hashMessage(hashV);
    // console.log(prefixedHash);
    // this.web3service.web3.eth.sign(prefixedHash,this.web3service.connectedAccount)
    // .then((signedMessage) => {
    //   console.log(signedMessage);
    //   // 0xc1aadf5eae1539f644d72908b72fb0e3be76b64ffef511ff41e9eecf4f07bbff22f15c3be299af8466f99306a7b8676d657146b40cdae481c62edf3eb847f2991b
    //   let v, r, s;
    //   r = signedMessage.slice(0,66)
    //   s = '0x'+signedMessage.slice(66,130)
    //   v = this.web3service.web3.utils.hexToNumber('0x'+signedMessage.slice(130,132))
    //   console.log(r)
    //   console.log(s)
    //   console.log(v)
      
    // })
    //   order['v'] = v;
    //   order['r'] = r;
    //   order['s'] = s;
    //   return order;
    // })
    for(let token of EthereumTokensSN) {
      if(token.address === '0x0000000000000000000000000000000000000000')
        continue
      console.log(token);
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