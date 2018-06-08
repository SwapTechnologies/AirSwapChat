import { TestBed, inject } from '@angular/core/testing';

import { UserOnlineService } from './user-online.service';

describe('UserOnlineService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserOnlineService]
    });
  });

  it('should be created', inject([UserOnlineService], (service: UserOnlineService) => {
    expect(service).toBeTruthy();
  }));
});
