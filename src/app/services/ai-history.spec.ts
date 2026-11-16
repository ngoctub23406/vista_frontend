import { TestBed } from '@angular/core/testing';

import { AiHistoryService } from './ai-history';

describe('AiHistoryService', () => {
  let service: AiHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

