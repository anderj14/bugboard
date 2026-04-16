import { TestBed } from '@angular/core/testing';

import { Bug } from './bug';

describe('Bug', () => {
  let service: Bug;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Bug);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
