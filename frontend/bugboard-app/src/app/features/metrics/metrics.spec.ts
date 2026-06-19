import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Metrics } from './metrics';
import { BugService } from '../../core/services/bug-service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('Metrics', () => {
  let component: Metrics;
  let fixture: ComponentFixture<Metrics>;
  let bugServiceMock: {
    getMetricsSummary: ReturnType<typeof vi.fn>;
    getMetricsBySeverity: ReturnType<typeof vi.fn>;
    getMetricsByModule: ReturnType<typeof vi.fn>;
    getMetricsTimeline: ReturnType<typeof vi.fn>;
  };

  const mockSummary = { total: 10, open: 5, resolved: 3, critical: 2 };
  const mockBySeverity = [
    { severity: 'Critical', count: 2 },
    { severity: 'High', count: 3 },
  ];
  const mockByModule = [
    { module: 'auth', count: 4 },
    { module: 'ui', count: 3 },
  ];
  const mockTimeline = [
    { date: '2024-01-01', count: 2 },
    { date: '2024-01-02', count: 5 },
  ];

  beforeEach(async () => {
    bugServiceMock = {
      getMetricsSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getMetricsBySeverity: vi.fn().mockReturnValue(of(mockBySeverity)),
      getMetricsByModule: vi.fn().mockReturnValue(of(mockByModule)),
      getMetricsTimeline: vi.fn().mockReturnValue(of(mockTimeline)),
    };

    await TestBed.configureTestingModule({
      imports: [Metrics],
      providers: [
        provideRouter([]),
        { provide: BugService, useValue: bugServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Metrics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load summary metrics on init', () => {
    expect(bugServiceMock.getMetricsSummary).toHaveBeenCalled();
    expect(component.summary()).toEqual(mockSummary);
  });

  it('should load severity data on init', () => {
    expect(bugServiceMock.getMetricsBySeverity).toHaveBeenCalled();
  });

  it('should load module data on init', () => {
    expect(bugServiceMock.getMetricsByModule).toHaveBeenCalled();
  });

  it('should load timeline data on init', () => {
    expect(bugServiceMock.getMetricsTimeline).toHaveBeenCalled();
  });
});
