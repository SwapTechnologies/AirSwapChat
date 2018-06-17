import { TestBed, inject } from '@angular/core/testing';

import { TakerOrderService } from './taker-order.service';

describe('TakerOrderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TakerOrderService]
    });
  });

  it('should be created', inject([TakerOrderService], (service: TakerOrderService) => {
    expect(service).toBeTruthy();
  }));
});
