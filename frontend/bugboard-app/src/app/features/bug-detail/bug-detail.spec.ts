import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BugDetail } from './bug-detail';
import { BugService } from '../../core/services/bug-service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

describe('BugDetail', () => {
  let component: BugDetail;
  let fixture: ComponentFixture<BugDetail>;
  let bugServiceMock: { getBugById: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> };

  const mockBug = {
    id: 'abc-123',
    title: 'Test Bug',
    severity: 'High',
    module: 'auth',
    status: 'Open',
    raw_description: 'Something broke',
    ai_summary: 'AI summary',
    ai_confidence: 85,
    reproduction_steps: '1. Step one',
    suggested_fix: 'Fix it',
    is_duplicate: false,
    reporter_name: 'Anderson',
    reporter_email: 'a@test.com',
    source_app: 'my-app',
    browser: 'Chrome',
    operating_system: 'macOS',
    current_url: 'https://example.com',
    created_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    bugServiceMock = {
      getBugById: vi.fn().mockReturnValue(of(mockBug as any)),
      updateStatus: vi.fn().mockReturnValue(of({ ...mockBug, status: 'Resolved' } as any)),
    };

    await TestBed.configureTestingModule({
      imports: [BugDetail],
      providers: [
        provideRouter([]),
        { provide: BugService, useValue: bugServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'abc-123' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BugDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load bug on init', () => {
    expect(bugServiceMock.getBugById).toHaveBeenCalledWith('abc-123');
    expect(component.bug()?.title).toBe('Test Bug');
  });

  it('should update bug status', () => {
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: 'Resolved' } });

    component.updateStatus(event);

    expect(bugServiceMock.updateStatus).toHaveBeenCalledWith('abc-123', 'Resolved');
    expect(component.bug()?.status).toBe('Resolved');
  });

  it('should map severity to class', () => {
    expect(component.severityClass('Critical')).toBeTruthy();
  });
});
