import { Injectable } from '@angular/core';
import { } from '../types/types';
@Injectable({
  providedIn: 'root'
})
export class OrderRequestsService {

  public orderRequests: any[] = [];
  constructor() { }

  get openRequests(): number {
    return this.orderRequests.length;
  }

  addOrder(order:any): void {
    this.orderRequests.push(order);
  }
}
