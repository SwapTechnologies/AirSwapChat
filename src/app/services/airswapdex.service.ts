import { Injectable } from '@angular/core';

import { ConnectWeb3Service } from './connectWeb3.service';
import { EtherAddress } from './tokens';

@Injectable({
  providedIn: 'root'
})
export class AirswapdexService {

  // public airswapDexAddress: string = '0x2C40c44343214a0C81Ea8eEe6f5Ae75138062A0A'; // rinkeby
  public airswapDexAddress: string = '0x08a1d43a218adaf6273f323a1f5a43d930f3d69e'; // rinkeby
  
  // public airswapDex: string = '0x8fd3121013A07C57f0D69646E86E7a4880b467b7'; // mainnet
  public airswapDexABI: any = [{"constant":false,"inputs":[{"name":"makerAddress","type":"address"},{"name":"makerAmount","type":"uint256"},{"name":"makerToken","type":"address"},{"name":"takerAddress","type":"address"},{"name":"takerAmount","type":"uint256"},{"name":"takerToken","type":"address"},{"name":"expiration","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"fill","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"fills","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"makerAddress","type":"address"},{"name":"makerAmount","type":"uint256"},{"name":"makerToken","type":"address"},{"name":"takerAddress","type":"address"},{"name":"takerAmount","type":"uint256"},{"name":"takerToken","type":"address"},{"name":"expiration","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"cancel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"makerAddress","type":"address"},{"indexed":false,"name":"makerAmount","type":"uint256"},{"indexed":true,"name":"makerToken","type":"address"},{"indexed":false,"name":"takerAddress","type":"address"},{"indexed":false,"name":"takerAmount","type":"uint256"},{"indexed":true,"name":"takerToken","type":"address"},{"indexed":false,"name":"expiration","type":"uint256"},{"indexed":false,"name":"nonce","type":"uint256"}],"name":"Filled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"makerAddress","type":"address"},{"indexed":false,"name":"makerAmount","type":"uint256"},{"indexed":true,"name":"makerToken","type":"address"},{"indexed":false,"name":"takerAddress","type":"address"},{"indexed":false,"name":"takerAmount","type":"uint256"},{"indexed":true,"name":"takerToken","type":"address"},{"indexed":false,"name":"expiration","type":"uint256"},{"indexed":false,"name":"nonce","type":"uint256"}],"name":"Canceled","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"code","type":"uint256"},{"indexed":true,"name":"makerAddress","type":"address"},{"indexed":false,"name":"makerAmount","type":"uint256"},{"indexed":true,"name":"makerToken","type":"address"},{"indexed":false,"name":"takerAddress","type":"address"},{"indexed":false,"name":"takerAmount","type":"uint256"},{"indexed":true,"name":"takerToken","type":"address"},{"indexed":false,"name":"expiration","type":"uint256"},{"indexed":false,"name":"nonce","type":"uint256"}],"name":"Failed","type":"event"}];
  
  constructor(private web3service: ConnectWeb3Service) { }

  get airswapDexContract(): any {
    return new this.web3service.web3.eth.Contract(
      this.airswapDexABI,
      this.airswapDexAddress
    );
  }
  pad(num, size):string {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  }

  toHex(num):string {
    return this.web3service.web3.utils.toHex(num);
  }

  toChecksum(address: string): string {
    return this.web3service.web3.utils.toChecksumAddress(address);
  }

  fill(makerAddress: string, makerAmount: string, makerToken: string,
  takerAddress: string, takerAmount: string, takerToken: string,
  expiration: number,  nonce: number, v: string, r: string, s: string): Promise<any> {
    let gasPrice = 10e9;
    let gas = 200000;
    let dataString = '0x1d4d691d'
    dataString = dataString + this.pad(makerAddress.slice(2), 64)
    dataString = dataString + this.pad(this.toHex(makerAmount).slice(2), 64)
    dataString = dataString + this.pad(makerToken.slice(2), 64)
    dataString = dataString + this.pad(takerAddress.slice(2), 64)
    dataString = dataString + this.pad(this.toHex(takerAmount).slice(2), 64)
    dataString = dataString + this.pad(takerToken.slice(2), 64)
    dataString = dataString + this.pad(this.toHex(expiration).slice(2), 64)
    dataString = dataString + this.pad(this.toHex(nonce).slice(2), 64)
    dataString = dataString + this.pad(this.toHex(v).slice(2), 64)
    dataString = dataString + this.pad(r.slice(2), 64)
    dataString = dataString + this.pad(s.slice(2), 64)

    if(takerToken === EtherAddress) {
      return this.web3service.web3.eth.sendTransaction({
        from: this.web3service.connectedAccount,
        to: this.airswapDexAddress,
        value: takerAmount,
        gas: gas,
        gasPrice: 10e9,
        data: dataString
      })
    } else {
      return this.web3service.web3.eth.sendTransaction({
        from: this.web3service.connectedAccount,
        to: this.airswapDexAddress,
        gas: gas,
        gasPrice: 10e9,
        data: dataString
      })
    }
  }

}
