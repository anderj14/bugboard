import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { BugService } from '../../core/services/bug-service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let bugServiceMock: { getBugs: ReturnType<typeof vi.fn> };

  const mockBugs = [
    {
      id: '1',
      title: 'Critical bug',
      severity: 'Critical',
      module: 'auth',
      status: 'Open',
      raw_description: 'Critical issue',
      is_duplicate: false,
      browser: 'Chrome',
      operating_system: 'macOS',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Low bug',
      severity: 'Low',
      module: 'ui',
      status: 'Resolved',
      raw_description: 'Minor issue',
      is_duplicate: false,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    bugServiceMock = { getBugs: vi.fn().mockReturnValue(of(mockBugs as any)) };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: BugService, useValue: bugServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load bugs on init', () => {
    expect(bugServiceMock.getBugs).toHaveBeenCalled();
    expect(component.bugs()).toEqual(mockBugs as any);
  });

  it('should filter by severity', () => {
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: 'Critical' } });
    component.filterSeverity(event);

    expect(component.filters.severity).toBe('Critical');
    expect(bugServiceMock.getBugs).toHaveBeenCalledWith({ severity: 'Critical' });
  });

  it('should filter by module', () => {
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: 'auth' } });
    component.filterModule(event);

    expect(component.filters.module).toBe('auth');
    expect(bugServiceMock.getBugs).toHaveBeenCalledWith({ module: 'auth' });
  });

  it('should count bugs by severity', () => {
    expect(component.countBySeverity('Critical')).toBe(1);
  });

  it('should count bugs by status', () => {
    expect(component.countByStatus('Resolved')).toBe(1);
  });

  it('should map severity to class', () => {
    expect(component.severityClass('Critical')).toBeTruthy();
  });

  it('should map status to class', () => {
    expect(component.statusClass('Open')).toBeTruthy();
  });
});
