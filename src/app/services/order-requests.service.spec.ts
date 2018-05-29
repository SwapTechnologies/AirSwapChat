import { TestBed, inject } from '@angular/core/testing';

import { OrderRequestsService } from './order-requests.service';

describe('OrderRequestsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderRequestsService]
    });
  });

  it('should be created', inject([OrderRequestsService], (service: OrderRequestsService) => {
    expect(service).toBeTruthy();
  }));
});
