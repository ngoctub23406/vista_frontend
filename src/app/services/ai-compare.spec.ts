import { TestBed } from '@angular/core/testing';

import { AiCompareService } from './ai-compare';

describe('AiCompareService', () => {
  let service: AiCompareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiCompareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

