import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BugWidget } from './bug-widget';
import { BugService } from '../../../core/services/bug-service';
import { of } from 'rxjs';

describe('BugWidget', () => {
  let component: BugWidget;
  let fixture: ComponentFixture<BugWidget>;
  let bugServiceMock: { classifyPreview: ReturnType<typeof vi.fn>; createBug: ReturnType<typeof vi.fn> };

  const mockBug = {
    id: '1',
    title: 'Widget bug',
    severity: 'Medium',
    module: 'ui',
  };

  beforeEach(async () => {
    bugServiceMock = {
      classifyPreview: vi.fn().mockReturnValue(of(mockBug as any)),
      createBug: vi.fn().mockReturnValue(of(mockBug as any)),
    };

    await TestBed.configureTestingModule({
      imports: [BugWidget],
      providers: [
        { provide: BugService, useValue: bugServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BugWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start closed', () => {
    expect(component.isOpen).toBeFalsy();
  });

  it('should submit bug report', () => {
    component.form.setValue({ description: 'Long enough description', name: 'Test' });

    component.submit();

    expect(bugServiceMock.createBug).toHaveBeenCalled();
    expect(component.submitted).toBeTruthy();
  });

  it('should close widget', () => {
    component.isOpen = true;
    component.submitted = true;
    component.form.setValue({ description: 'test', name: 'test' });

    component.closeWidget();

    expect(component.isOpen).toBeFalsy();
    expect(component.submitted).toBeFalsy();
    expect(component.form.value.description).toBeNull();
  });

  it('should map severity to class', () => {
    expect(component.severityClass('Critical')).toBeTruthy();
  });
});
