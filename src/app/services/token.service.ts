import { Injectable } from '@angular/core';

import { FirebaseService } from './firebase.service';

import { validatedTokens } from './tokens-validated';
import { Token } from '../types/types';

export const EtherAddress = '0x0000000000000000000000000000000000000000';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  public validatedTokens: Token[];
  public customTokens: Token[] = [];

  public lastUpdateOfCustomTokens = 0;

  constructor(
    private firebaseService: FirebaseService,
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
      return x.name.toLowerCase() === name.toLowerCase()
             || x.symbol.toLowerCase() === name.toLowerCase();
    });

    if (validToken) {
      return validToken;
    } else {
      validToken = this.customTokens.find(x => {
        return x.name.toLowerCase() === name.toLowerCase()
               || x.symbol.toLowerCase() === name.toLowerCase();
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

  getTokenAndWhetherItsValidByName(name: string): any {
    let isValid: boolean;
    let token: Token;

    token = validatedTokens.find(x => {
      return x.name.toLowerCase() === name.toLowerCase()
             || x.symbol.toLowerCase() === name.toLowerCase();
    });

    if (token) {
      isValid = true;
    } else {
      token = this.customTokens.find(x => {
        return x.name.toLowerCase() === name.toLowerCase()
             || x.symbol.toLowerCase() === name.toLowerCase();
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
    for (const token of this.validatedTokens) {
      token.address = token.address.toLowerCase();
    }
    this.validatedTokens = this.validatedTokens.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) { return -1; }
      if (a.name.toLowerCase() > b.name.toLowerCase()) { return 1; }
      return 0;
    });
    return this.validatedTokens;
  }

  getCustomTokenListFromDB(): Promise<Token[]> {
    if (!this.customTokens || Date.now() - this.lastUpdateOfCustomTokens > 60000) {
      this.lastUpdateOfCustomTokens = Date.now();
      return this.firebaseService.getTokenListFromDatabase()
      .then((customTokens) => {
        this.customTokens = customTokens.sort((a, b) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) { return -1; }
          if (a.name.toLowerCase() > b.name.toLowerCase()) { return 1; }
          return 0;
        });
        return this.customTokens;
      });
    } else {
      return Promise.resolve(this.customTokens);
    }
  }

  addTokenToCustomList(address: string, name: string,
  symbol: string, decimals: number): void {
    if (!this.getToken(address)) {
      const newToken: Token = {
        name: name,
        symbol: symbol,
        decimals: decimals,
        address: address
      };
      this.customTokens.push(newToken);
      this.customTokens = this.customTokens.sort((a, b) => {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });
    }

  }
}
