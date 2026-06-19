import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BugReport } from './bug-report';
import { BugService } from '../../core/services/bug-service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('BugReport', () => {
  let component: BugReport;
  let fixture: ComponentFixture<BugReport>;
  let bugServiceMock: { classifyPreview: ReturnType<typeof vi.fn>; createBug: ReturnType<typeof vi.fn> };

  const mockPreview = {
    title: 'Preview',
    severity: 'High',
    module: 'auth',
    ai_summary: 'Summary',
    ai_confidence: 85,
  };

  const mockCreatedBug = {
    id: 'new-id',
    ...mockPreview,
    raw_description: 'Test bug description here',
  };

  beforeEach(async () => {
    bugServiceMock = {
      classifyPreview: vi.fn().mockReturnValue(of(mockPreview as any)),
      createBug: vi.fn().mockReturnValue(of(mockCreatedBug as any)),
    };

    await TestBed.configureTestingModule({
      imports: [BugReport],
      providers: [
        provideRouter([]),
        { provide: BugService, useValue: bugServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BugReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have form with description required', () => {
    const description = component.form.get('description');
    expect(description).toBeTruthy();
  });

  it('should submit bug report', () => {
    component.form.setValue({
      description: 'Test bug description here',
      name: 'Anderson',
      email: 'a@test.com',
      sourceApp: 'my-app',
    });

    component.submit();

    expect(bugServiceMock.createBug).toHaveBeenCalled();
    expect(component.submitted).toBeTruthy();
    expect(component.lastBug?.title).toBe('Preview');
  });

  it('should not submit if form is invalid', () => {
    component.form.setValue({
      description: '',
      name: '',
      email: '',
      sourceApp: '',
    });

    component.submit();

    expect(bugServiceMock.createBug).not.toHaveBeenCalled();
  });

  it('should return severity class', () => {
    expect(component.severityClass('High')).toBeTruthy();
  });
});
