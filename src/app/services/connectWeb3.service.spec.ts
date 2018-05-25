import { TestBed, inject } from '@angular/core/testing';

import { ConnectWeb3Service } from './connectWeb3.service';

describe('ConnectWeb3Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectWeb3Service]
    });
  });

  it('should be created', inject([ConnectWeb3Service], (service: ConnectWeb3Service) => {
    expect(service).toBeTruthy();
  }));
});
