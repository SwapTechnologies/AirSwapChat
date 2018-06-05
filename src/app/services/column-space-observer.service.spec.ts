import { TestBed, inject } from '@angular/core/testing';

import { ColumnSpaceObserverService } from './column-space-observer.service';

describe('ColumnSpaceObserverService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ColumnSpaceObserverService]
    });
  });

  it('should be created', inject([ColumnSpaceObserverService], (service: ColumnSpaceObserverService) => {
    expect(service).toBeTruthy();
  }));
});
