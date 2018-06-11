import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { ConnectWeb3Service } from '../../services/connectWeb3.service';
import { Erc20Service } from '../../services/erc20.service';
import { FirebaseService } from '../../services/firebase.service';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-dialog-add-token',
  templateUrl: './dialog-add-token.component.html',
  styleUrls: ['./dialog-add-token.component.scss']
})
export class DialogAddTokenComponent implements OnInit {
  public tokenAddress: string;
  public tokenName: string;
  public tokenSymbol: string;
  public tokenDecimals: number;

  public checkedToken = false;
  public tokenIsValid = false;
  public errorMessage: string;

  constructor(
    public dialogRef: MatDialogRef<DialogAddTokenComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private erc20Service: Erc20Service,
    private firebaseService: FirebaseService,
    private tokenService: TokenService,
    private web3Service: ConnectWeb3Service,
  ) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onCloseConfirm() {
    this.dialogRef.close(true);
  }

  onCloseCancel() {
    this.dialogRef.close(false);
  }

  addToken(): void {
    if (this.tokenIsValid) {
      this.firebaseService.addToken(
        this.tokenAddress, this.tokenName,
        this.tokenSymbol, this.tokenDecimals
      ).then(addedToken => {
        if (addedToken) {
          this.tokenService.addTokenToCustomList(this.tokenAddress, this.tokenName,
            this.tokenSymbol, this.tokenDecimals);
          this.onCloseConfirm();
        } else {
          this.onCloseCancel();
        }
      });
    }
  }

  checkToken(): void {
    this.checkedToken = false;
    this.tokenName = null;
    this.tokenSymbol = null;
    this.tokenDecimals = null;
    if (this.tokenAddress) {
      this.tokenAddress = this.tokenAddress.trim();
    }

    if (!this.web3Service.web3.utils.isAddress(this.tokenAddress)) {
      this.errorMessage = 'Enter a valid contract address';
    } else {
      this.firebaseService.getTokenFromDatabase(this.tokenAddress)
      .then(token => {
        let tokenInDB = false;
        let validToken = true;
        if (token) {
          tokenInDB = true;
          this.errorMessage = 'Token is already in database.';
        }

        const contract = this.erc20Service.getContract(this.tokenAddress);
        const promiseList = [];

        promiseList.push(
          this.erc20Service.name(contract)
          .then(name => this.tokenName = name)
          .catch(() => validToken = false)
        );
        promiseList.push(
          this.erc20Service.symbol(contract)
          .then(symbol => this.tokenSymbol = symbol)
          .catch(() => validToken = false)
        );
        promiseList.push(
            this.erc20Service.decimals(contract)
          .then(decimals => this.tokenDecimals = decimals)
          .catch(() => validToken = false)
        );
        Promise.all(promiseList)
        .then(() => {
          this.checkedToken = true;
          this.tokenIsValid = !tokenInDB
                              && validToken
                              && this.tokenName
                              && this.tokenSymbol
                              && this.tokenDecimals >= 0;
          if (this.tokenIsValid) {
            this.errorMessage = '';
          } else if (!validToken) {
            this.errorMessage = 'Token is not ERC20 compatible.';
          }
        });
      });
    }
  }

}
