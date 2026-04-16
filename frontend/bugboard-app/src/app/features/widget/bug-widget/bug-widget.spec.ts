import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BugWidget } from './bug-widget';

describe('BugWidget', () => {
  let component: BugWidget;
  let fixture: ComponentFixture<BugWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BugWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(BugWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
