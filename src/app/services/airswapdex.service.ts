import { Injectable } from '@angular/core';

import { ConnectWeb3Service } from './connectWeb3.service';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { EtherAddress } from './token.service';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AirswapdexService {

  public airswapDexAddress = environment.ethereumNetwork.airswapDexAddress;
  public airswapDexABI = [
    {
      'name': 'fill',
      'type': 'function',
      'constant': false,
      'inputs': [
        {'name': 'makerAddress', 'type': 'address'},
        {'name': 'makerAmount', 'type': 'uint256'},
        {'name': 'makerToken', 'type': 'address'},
        {'name': 'takerAddress', 'type': 'address'},
        {'name': 'takerAmount', 'type': 'uint256'},
        {'name': 'takerToken', 'type': 'address'},
        {'name': 'expiration', 'type': 'uint256'},
        {'name': 'nonce', 'type': 'uint256'},
        {'name': 'v', 'type': 'uint8'},
        {'name': 'r', 'type': 'bytes32'},
        {'name': 's', 'type': 'bytes32'}
      ],
      'outputs': [],
      'payable': true,
      'stateMutability': 'payable',
    }, {
      'name': 'fills',
      'type': 'function',
      'constant': true,
      'inputs': [
        {'name': '', 'type': 'bytes32'}
      ],
      'outputs': [
        {'name': '', 'type': 'bool'}
      ],
      'payable': false,
      'stateMutability': 'view',
    }, {
      'name': 'cancel',
      'type': 'function',
      'constant': false,
      'inputs': [
        {'name': 'makerAddress', 'type': 'address'},
        {'name': 'makerAmount', 'type': 'uint256'},
        {'name': 'makerToken', 'type': 'address'},
        {'name': 'takerAddress', 'type': 'address'},
        {'name': 'takerAmount', 'type': 'uint256'},
        {'name': 'takerToken', 'type': 'address'},
        {'name': 'expiration', 'type': 'uint256'},
        {'name': 'nonce', 'type': 'uint256'},
        {'name': 'v', 'type': 'uint8'},
        {'name': 'r', 'type': 'bytes32'},
        {'name': 's', 'type': 'bytes32'}
      ],
      'outputs': [],
      'payable': false,
      'stateMutability': 'nonpayable',
    }, {
      'name': 'Filled',
      'type': 'event',
      'anonymous': false,
      'inputs': [
        {'indexed': true, 'name': 'makerAddress', 'type': 'address'},
        {'indexed': false, 'name': 'makerAmount', 'type': 'uint256'},
        {'indexed': true, 'name': 'makerToken', 'type': 'address'},
        {'indexed': false, 'name': 'takerAddress', 'type': 'address'},
        {'indexed': false, 'name': 'takerAmount', 'type': 'uint256'},
        {'indexed': true, 'name': 'takerToken', 'type': 'address'},
        {'indexed': false, 'name': 'expiration', 'type': 'uint256'},
        {'indexed': false, 'name': 'nonce', 'type': 'uint256'}
      ],
    }, {
      'name': 'Canceled',
      'type': 'event',
      'anonymous': false,
      'inputs': [
        {'indexed': true, 'name': 'makerAddress', 'type': 'address'},
        {'indexed': false, 'name': 'makerAmount', 'type': 'uint256'},
        {'indexed': true, 'name': 'makerToken', 'type': 'address'},
        {'indexed': false, 'name': 'takerAddress', 'type': 'address'},
        {'indexed': false, 'name': 'takerAmount', 'type': 'uint256'},
        {'indexed': true, 'name': 'takerToken', 'type': 'address'},
        {'indexed': false, 'name': 'expiration', 'type': 'uint256'},
        {'indexed': false, 'name': 'nonce', 'type': 'uint256'}
      ],
    }, {
      'name': 'Failed',
      'type': 'event',
      'anonymous': false,
      'inputs': [
        {'indexed': false, 'name': 'code', 'type': 'uint256'},
        {'indexed': true, 'name': 'makerAddress', 'type': 'address'},
        {'indexed': false, 'name': 'makerAmount', 'type': 'uint256'},
        {'indexed': true, 'name': 'makerToken', 'type': 'address'},
        {'indexed': false, 'name': 'takerAddress', 'type': 'address'},
        {'indexed': false, 'name': 'takerAmount', 'type': 'uint256'},
        {'indexed': true, 'name': 'takerToken', 'type': 'address'},
        {'indexed': false, 'name': 'expiration', 'type': 'uint256'},
        {'indexed': false, 'name': 'nonce', 'type': 'uint256'}
      ],
    }];

  constructor(
    private web3service: ConnectWeb3Service,
    private http: HttpClient,
    private wsService: WebsocketService
  ) { }

  get airswapDexContract(): any {
    return new this.web3service.web3.eth.Contract(
      this.airswapDexABI,
      this.airswapDexAddress
    );
  }

  pad(num, size): string {
    let s = num + '';
    while (s.length < size) {
      s = '0' + s;
    }
    return s;
  }

  toHex(num): string {
    return this.web3service.web3.utils.toHex(num);
  }

  toChecksum(address: string): string {
    return this.web3service.web3.utils.toChecksumAddress(address);
  }
  // makerAddress: string, makerAmount: string, makerToken: string,
  // takerAddress: string, takerAmount: string, takerToken: string,
  // expiration: number,  nonce: number, v: string, r: string, s: string
  fill(order: any, gettingMined: (string) => any): Promise<any> {
    const makerAddress = order['makerAddress'];
    const makerAmount = order['makerAmount'];
    const makerToken = order['makerToken'];
    const takerAddress = order['takerAddress'];
    const takerAmount = order['takerAmount'];
    const takerToken = order['takerToken'];
    const expiration = order['expiration'];
    const nonce = order['nonce'];
    const v = order['v'];
    const r = order['r'];
    const s = order['s'];
    const gas = 200000;
    let dataString = '0x1d4d691d';
    dataString = dataString + this.pad(makerAddress.slice(2), 64);
    dataString = dataString + this.pad(this.toHex(makerAmount).slice(2), 64);
    dataString = dataString + this.pad(makerToken.slice(2), 64);
    dataString = dataString + this.pad(takerAddress.slice(2), 64);
    dataString = dataString + this.pad(this.toHex(takerAmount).slice(2), 64);
    dataString = dataString + this.pad(takerToken.slice(2), 64);
    dataString = dataString + this.pad(this.toHex(expiration).slice(2), 64);
    dataString = dataString + this.pad(this.toHex(nonce).slice(2), 64);
    dataString = dataString + this.pad(this.toHex(v).slice(2), 64);
    dataString = dataString + this.pad(r.slice(2), 64);
    dataString = dataString + this.pad(s.slice(2), 64);
    return this.http.get('https://ethgasstation.info/json/ethgasAPI.json')
    .toPromise()
    .then(ethGasStationResult => {
      let gasPrice = 10e9;
      if (ethGasStationResult['average']) {
        gasPrice = ethGasStationResult['average'] / 10 * 1e9;
      }
      if (takerToken === EtherAddress) {
        return this.web3service.web3.eth.sendTransaction({
          from: this.web3service.connectedAccount,
          to: this.airswapDexAddress,
          value: takerAmount,
          gas: gas,
          gasPrice: gasPrice,
          data: dataString
        }, ((error, result) => {
          if (error) {
            return error;
          } else {
            gettingMined(result);
          }
        }));
      } else {
        return this.web3service.web3.eth.sendTransaction({
          from: this.web3service.connectedAccount,
          to: this.airswapDexAddress,
          gas: gas,
          gasPrice: gasPrice,
          data: dataString
        }, ((error, result) => {
          if (error) {
            return error;
          } else {
            gettingMined(result);
          }
        }));
      }
    });
  }

}
