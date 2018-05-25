import { TestBed, inject } from '@angular/core/testing';

import { WebsocketServiceService } from './websocket-service.service';

describe('WebsocketServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebsocketServiceService]
    });
  });

  it('should be created', inject([WebsocketServiceService], (service: WebsocketServiceService) => {
    expect(service).toBeTruthy();
  }));
});
