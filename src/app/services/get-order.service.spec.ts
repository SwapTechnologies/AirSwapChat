import { TestBed, inject } from '@angular/core/testing';

import { GetOrderService } from './get-order.service';

describe('GetOrderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GetOrderService]
    });
  });

  it('should be created', inject([GetOrderService], (service: GetOrderService) => {
    expect(service).toBeTruthy();
  }));
});
