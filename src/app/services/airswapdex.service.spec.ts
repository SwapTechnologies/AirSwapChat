import { TestBed, inject } from '@angular/core/testing';

import { AirswapdexService } from './airswapdex.service';

describe('AirswapdexService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AirswapdexService]
    });
  });

  it('should be created', inject([AirswapdexService], (service: AirswapdexService) => {
    expect(service).toBeTruthy();
  }));
});
