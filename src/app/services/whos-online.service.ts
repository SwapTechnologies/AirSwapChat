import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

import { LoggedInUser } from '../types/types';

@Injectable({
  providedIn: 'root'
})
export class WhosOnlineService {

  public whosOnlineList: LoggedInUser[] = [];

  constructor(private firebaseService: FirebaseService) { }

  get numOnline(): Promise<number> {
    return this.firebaseService.readWhoIsOnline()
    .then((whosOnlineList) => {
      this.whosOnlineList = whosOnlineList.sort((a,b) => {
        return ((a.alias < b.alias) ? -1 : (a.alias > b.alias) ? 1 : 0)
      })
      return whosOnlineList.length;
    })
    
  }


}