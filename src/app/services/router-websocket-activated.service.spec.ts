import { TestBed, inject } from '@angular/core/testing';

import { RouterWebsocketActivatedService } from './router-websocket-activated.service';

describe('RouterWebsocketActivatedService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RouterWebsocketActivatedService]
    });
  });

  it('should be created', inject([RouterWebsocketActivatedService], (service: RouterWebsocketActivatedService) => {
    expect(service).toBeTruthy();
  }));
});
