import { Injectable } from '@angular/core';

import { FirebaseService } from './firebase.service';
import { Erc20Service } from './erc20.service';

import { validatedTokens } from './tokens-validated';
import { Token } from '../types/types';

export const EtherAddress = '0x0000000000000000000000000000000000000000';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  public validatedTokens: Token[];
  public customTokens: Token[];

  constructor(
    private firebaseService: FirebaseService,
    private erc20Service: Erc20Service,
  ) { }

  getToken(address: string): Token {
    let validToken = validatedTokens.find(x => {
      return x.address === address;
    });

    if (validToken) {
      return validToken;
    } else {
      validToken = this.customTokens.find(x => {
        return x.address === address;
      });
      if (validToken) {
        return validToken;
      } else {
        return null;
      }
    }
  }

  getTokenByName(name: string): Token {
    let validToken = validatedTokens.find(x => {
      return x.name === name;
    });

    if (validToken) {
      return validToken;
    } else {
      validToken = this.customTokens.find(x => {
        return x.name === name;
      });
      if (validToken) {
        return validToken;
      } else {
        return null;
      }
    }
  }

  getTokenAndWhetherItsValid(address: string): any {
    let isValid: boolean;
    let token: Token;

    token = validatedTokens.find(x => {
      return x.address === address;
    });

    if (token) {
      isValid = true;
    } else {
      token = this.customTokens.find(x => {
        return x.address === address;
      });
      if (token) {
        isValid = false;
      } else {
        token = null;
        isValid = false;
      }
    }
    return {
      token: token,
      isValid: isValid
    };
  }

  isValidToken(address: string): boolean {
    const validToken = validatedTokens.find(x => {
      return x.address === address;
    });
    if (validToken) {
      return true;
    } else {
      return false;
    }
  }

  getValidatedTokens(): Token[] {
    this.validatedTokens = validatedTokens;
    return validatedTokens;
  }

  getCustomTokenList(): Promise<Token[]> {
    return this.firebaseService.getTokenListFromDatabase()
    .then((customTokens) => {
      this.customTokens = customTokens;
      return customTokens;
    });
  }

}
