import { Injectable, NgZone } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { WebsocketService } from '../services/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class RouterWebsocketActivatedService implements CanActivate {

  constructor(
    private wsService: WebsocketService,
    private router: Router,
    private zone: NgZone) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean>|Promise<boolean>|boolean {
    if (!this.wsService.connectionEstablished) {
      this.zone.run(() => {
        this.router.navigate([""]);
      })
    }
    return true;
  }
}
