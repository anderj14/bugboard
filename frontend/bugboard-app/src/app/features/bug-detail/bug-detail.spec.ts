import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BugDetail } from './bug-detail';

describe('BugDetail', () => {
  let component: BugDetail;
  let fixture: ComponentFixture<BugDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BugDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(BugDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
