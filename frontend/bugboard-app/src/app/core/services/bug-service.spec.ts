import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BugService } from './bug-service';

describe('BugService', () => {
  let service: BugService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BugService,
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(BugService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch bugs with filters', () => {
    const mockBugs = [{ id: '1', title: 'Bug 1' }];

    service.getBugs({ severity: 'CRITICAL', status: 'OPEN' }).subscribe(bugs => {
      expect(bugs).toEqual(mockBugs as any);
    });

    const req = httpMock.expectOne(r =>
      r.url.includes('/bugs') && r.params.has('severity') && r.params.has('status')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockBugs);
  });

  it('should fetch bugs without filters', () => {
    service.getBugs().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/bugs'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should create a bug', () => {
    const dto = { raw_description: 'Test bug', reporter_name: 'Anderson' };
    const mockResponse = { id: '1', ...dto };

    service.createBug(dto as any).subscribe(bug => {
      expect(bug).toEqual(mockResponse as any);
    });

    const req = httpMock.expectOne(r => r.url.includes('/bugs') && r.method === 'POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });

  it('should get bug by id', () => {
    const mockBug = { id: 'abc-123', title: 'Bug detail' };

    service.getBugById('abc-123').subscribe(bug => {
      expect(bug).toEqual(mockBug as any);
    });

    const req = httpMock.expectOne(r => r.url.includes('abc-123'));
    expect(req.request.method).toBe('GET');
    req.flush(mockBug);
  });

  it('should update bug status', () => {
    const mockBug = { id: '1', status: 'OPEN' };

    service.updateStatus('1', 'OPEN').subscribe(bug => {
      expect(bug).toEqual(mockBug as any);
    });

    const req = httpMock.expectOne(r => r.url.includes('/status') && r.method === 'PATCH');
    expect(req.request.body).toEqual({ status: 'OPEN' });
    req.flush(mockBug);
  });

  it('should classify preview', () => {
    const mockPreview = { title: 'Preview', severity: 'High' };

    service.classifyPreview('Test description').subscribe(preview => {
      expect(preview).toEqual(mockPreview as any);
    });

    const req = httpMock.expectOne(r => r.url.includes('/preview') && r.method === 'POST');
    expect(req.request.body).toEqual({ raw_description: 'Test description' });
    req.flush(mockPreview);
  });

  it('should fetch metrics summary', () => {
    const mockSummary = { total: 10, open: 5 };

    service.getMetricsSummary().subscribe(summary => {
      expect(summary).toEqual(mockSummary);
    });

    const req = httpMock.expectOne(r => r.url.includes('/metrics/summary'));
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });
});
