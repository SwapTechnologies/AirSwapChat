import { Injectable } from '@angular/core';
import { ConnectWeb3Service } from './connectWeb3.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Erc20Service {
  public EtherAddress = '0x0000000000000000000000000000000000000000';
  public ABI = [
    {
      'constant': true,
      'inputs': [],
      'name': 'name',
      'outputs': [ { 'name': '', 'type': 'string'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': false,
      'inputs': [{ 'name': '_spender', 'type': 'address'}, { 'name': '_value', 'type': 'uint256'}],
      'name': 'approve',
      'outputs': [{ 'name': 'success', 'type': 'bool'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': true,
      'inputs': [],
      'name': 'totalSupply',
      'outputs': [{ 'name': '', 'type': 'uint256'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': false,
      'inputs': [{ 'name': '_from', 'type': 'address'}, { 'name': '_to', 'type': 'address'}, { 'name': '_value', 'type': 'uint256'}],
      'name': 'transferFrom',
      'outputs': [{ 'name': 'success', 'type': 'bool'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': true,
      'inputs': [],
      'name': 'decimals',
      'outputs': [{ 'name': '', 'type': 'uint8'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': true,
      'inputs': [],
      'name': 'version',
      'outputs': [{ 'name': '', 'type': 'string'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': true,
      'inputs': [{ 'name': '_owner', 'type': 'address'}],
      'name': 'balanceOf',
      'outputs': [{ 'name': 'balance', 'type': 'uint256'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': true,
      'inputs': [],
      'name': 'symbol',
      'outputs': [{ 'name': '', 'type': 'string'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': false,
      'inputs': [{ 'name': '_to', 'type': 'address'}, { 'name': '_value', 'type': 'uint256'}],
      'name': 'transfer',
      'outputs': [{ 'name': 'success', 'type': 'bool'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': false,
      'inputs': [
        { 'name': '_spender', 'type': 'address'},
        { 'name': '_value', 'type': 'uint256'},
        { 'name': '_extraData', 'type': 'bytes'}
      ],
      'name': 'approveAndCall',
      'outputs': [{ 'name': 'success', 'type': 'bool'}],
      'payable': false,
      'type': 'function'
    }, {
      'constant': true,
      'inputs': [{ 'name': '_owner', 'type': 'address'}, { 'name': '_spender', 'type': 'address'}],
      'name': 'allowance',
      'outputs': [{ 'name': 'remaining', 'type': 'uint256'}],
      'payable': false,
      'type': 'function'
    }, {
      'inputs': [
        { 'name': '_initialAmount', 'type': 'uint256'},
        { 'name': '_tokenName', 'type': 'string'},
        { 'name': '_decimalUnits', 'type': 'uint8'},
        { 'name': '_tokenSymbol', 'type': 'string'}
      ],
      'type': 'constructor'
    }, {
      'payable': false,
      'type': 'fallback'
    }, {
        'anonymous': false,
        'inputs': [
          { 'indexed': true, 'name': '_from', 'type': 'address'},
          { 'indexed': true, 'name': '_to', 'type': 'address'},
          { 'indexed': false, 'name': '_value', 'type': 'uint256'}
        ],
        'name': 'Transfer',
        'type': 'event'
      }, {
        'anonymous': false,
        'inputs': [
          { 'indexed': true, 'name': '_owner', 'type': 'address'},
          { 'indexed': true, 'name': '_spender', 'type': 'address'},
          { 'indexed': false, 'name': '_value', 'type': 'uint256'}
        ],
        'name': 'Approval',
        'type': 'event'
    },
  ];


  constructor(
    private web3service: ConnectWeb3Service,
    private http: HttpClient
  ) { }

  getContract(address): any {
    return new this.web3service.web3.eth.Contract(
      this.ABI, address);
  }

  toFixed(x) {
    if (Math.abs(x) < 1.0) {
      const e = parseInt(x.toString().split('e-')[1], 10);
      if (e) {
          x *= Math.pow(10, e - 1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      let e = parseInt(x.toString().split('+')[1], 10);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10, e);
          x += (new Array(e + 1)).join('0');
      }
    }
    return x;
  }

  decimals(contract: any): Promise<number> {
    return contract.methods.decimals().call()
    .then(decimals => decimals);
  }

  balance(tokenAddress: any, address: string): Promise<number> {
    if (tokenAddress === this.EtherAddress) {
      return this.web3service.getBalance(address);
    } else {
      const contract = this.getContract(tokenAddress);
      return contract.methods
      .balanceOf(address)
      .call()
      .then(balance => balance);
    }
  }

  symbol(contract: any): Promise<string> {
    return contract.methods
    .symbol()
    .call()
    .then(symbol => symbol);
  }

  name(contract: any): Promise<string> {
    return contract.methods
    .name()
    .call()
    .then(name => name);
  }


  approvedAmount(contract: any, spender): Promise<number> {
    return contract.methods
    .allowance(this.web3service.connectedAccount, spender)
    .call()
    .then(approvedAmount => approvedAmount);
  }

  approve(contract: any, spender: string): Promise<any> {
    let approveMethod;
    let gasPrice = 10e9;

    return this.http.get('https://ethgasstation.info/json/ethgasAPI.json')
    .toPromise()
    .then(ethGasStationResult => {
      if (ethGasStationResult['average']) {
        gasPrice = ethGasStationResult['average'] / 10 * 1e9;
      }
      return this.decimals(contract);
    }).then(decimals => {
      const largeApproval = this.toFixed(1e21 * 10 ** decimals);
      approveMethod = contract.methods
      .approve(spender, largeApproval);
      return approveMethod.estimateGas({from: this.web3service.connectedAccount});
    }).then(estimatedGas => {
      return approveMethod.send({
        from: this.web3service.connectedAccount,
        gas: Math.round(estimatedGas * 1.1),
        gasPrice: gasPrice
      });
    });
  }
}
