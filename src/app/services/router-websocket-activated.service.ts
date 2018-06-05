import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { ConnectionService } from '../services/connection.service';

@Injectable({
  providedIn: 'root'
})
export class RouterWebsocketActivatedService implements CanActivate {

  constructor(
    private connectionService: ConnectionService,
    public router: Router,
  ) { }

  canActivate(): boolean {
    if (!this.connectionService.connected) {
      console.log('Rerouting.');
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}
