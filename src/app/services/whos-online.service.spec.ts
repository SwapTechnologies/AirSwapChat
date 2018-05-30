import { TestBed, inject } from '@angular/core/testing';

import { WhosOnlineService } from './whos-online.service';

describe('WhosOnlineService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WhosOnlineService]
    });
  });

  it('should be created', inject([WhosOnlineService], (service: WhosOnlineService) => {
    expect(service).toBeTruthy();
  }));
});
