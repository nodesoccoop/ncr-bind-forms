import { TestBed } from '@angular/core/testing';

import { NcrBindFormsService } from './ncr-bind-forms.service';

describe('NcrBindFormsService', () => {
  let service: NcrBindFormsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NcrBindFormsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
