import { TestBed, inject } from '@angular/core/testing';

import { MakerOrderService } from './maker-order.service';

describe('MakerOrderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MakerOrderService]
    });
  });

  it('should be created', inject([MakerOrderService], (service: MakerOrderService) => {
    expect(service).toBeTruthy();
  }));
});
