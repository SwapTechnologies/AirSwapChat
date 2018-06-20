import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PriceInfoService {

  constructor(
    private http: HttpClient
  ) { }

  getPriceOfToken(tokenSymbol: string): Promise<any> {
    return this.http.get(`https://min-api.cryptocompare.com/data/pricemulti?` +
    `fsyms=` + tokenSymbol + `&tsyms=USD`)
    .toPromise()
    .then((result) => {
      return result;
    });
  }

  getPricesOfPair(tokenSymbol1: string, tokenSymbol2: string): Promise<any> {
    return this.getPriceOfToken(tokenSymbol1 + ',' + tokenSymbol2)
    .then(priceResult => {
      if (priceResult) {
        let priceMakerToken = priceResult[tokenSymbol1];
        if (!priceMakerToken) {
          priceMakerToken = 0;
        } else {
          priceMakerToken = priceMakerToken['USD'];
        }
        let priceTakerToken = priceResult[tokenSymbol2];
        if (!priceTakerToken) {
          priceTakerToken = 0;
        } else {
          priceTakerToken = priceTakerToken['USD'];
        }
        return {
          makerToken: priceMakerToken,
          takerToken: priceTakerToken
        };
      } else {
        return {
          makerToken: 0,
          takerToken: 0
        };
      }
    });
  }
}
