import { Injectable } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { MessagingService } from './messaging.service';
@Injectable({
  providedIn: 'root'
})
export class ColumnSpaceObserverService {

  public deviceSizeNumber = 1;

  constructor(
    private media: ObservableMedia,
    private messagingService: MessagingService
  ) {
    media.asObservable()
    .subscribe((change: MediaChange) => {
      if (change.mqAlias === 'xs') {
        this.deviceSizeNumber = 1;
      } else if (change.mqAlias === 'sm') {
        this.deviceSizeNumber = 1;
      } else if (change.mqAlias === 'md') {
        this.deviceSizeNumber = 2;
      } else {
        this.deviceSizeNumber = 3;
      }
    });
  }

  get columnNum(): number {
    let modifier = 0;
    if (this.messagingService.showMessenger && this.deviceSizeNumber > 1) {
      modifier = -1;
    }
    return this.deviceSizeNumber + modifier;
  }
}
