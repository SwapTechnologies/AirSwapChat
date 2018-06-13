import { TestBed, inject } from '@angular/core/testing';

import { PriceInfoService } from './price-info.service';

describe('PriceInfoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PriceInfoService]
    });
  });

  it('should be created', inject([PriceInfoService], (service: PriceInfoService) => {
    expect(service).toBeTruthy();
  }));
});
