import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { BugWidget } from "../widget/bug-widget/bug-widget";
import { Router } from '@angular/router';
import { BugService } from '../../core/services/bug-service';
import { Bug } from '../../core/models/bug';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [BugWidget, CommonModule],
  template: `
    <div class="flex flex-col gap-6">

      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-[var(--foreground)] font-bold" style="font-size:28px;line-height:1.2">Dashboard</h1>
        <div class="flex gap-3">
          <button class="btn btn-primary" (click)="router.navigate(['/report'])">
            + Report Bug
          </button>
          <button class="btn btn-secondary" (click)="router.navigate(['/metrics'])">
            📊 Metrics
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4">
        <div class="card overflow-hidden">
          <div class="flex flex-col gap-2" style="padding:20px">
            <p class="text-[var(--muted-foreground)] font-medium" style="font-size:13px;line-height:1.4">Total Bugs</p>
            <p class="text-[var(--foreground)] font-bold" style="font-size:34px;line-height:1.1">{{ bugs().length }}</p>
          </div>
        </div>
        <div class="card overflow-hidden" style="border-color:var(--color-error-foreground)">
          <div class="flex flex-col gap-2" style="padding:20px;background:var(--color-error)">
            <p class="text-[var(--color-error-foreground)] font-medium" style="font-size:13px;line-height:1.4">Critical</p>
            <p class="text-[var(--color-error-foreground)] font-bold" style="font-size:34px;line-height:1.1">{{ countBySeverity('Critical') }}</p>
          </div>
        </div>
        <div class="card overflow-hidden" style="border-color:var(--color-warning-foreground)">
          <div class="flex flex-col gap-2" style="padding:20px;background:var(--color-warning)">
            <p class="text-[var(--color-warning-foreground)] font-medium" style="font-size:13px;line-height:1.4">High</p>
            <p class="text-[var(--color-warning-foreground)] font-bold" style="font-size:34px;line-height:1.1">{{ countBySeverity('High') }}</p>
          </div>
        </div>
        <div class="card overflow-hidden" style="border-color:var(--color-success-foreground)">
          <div class="flex flex-col gap-2" style="padding:20px;background:var(--color-success)">
            <p class="text-[var(--color-success-foreground)] font-medium" style="font-size:13px;line-height:1.4">Resolved</p>
            <p class="text-[var(--color-success-foreground)] font-bold" style="font-size:34px;line-height:1.1">{{ countByStatus('Resolved') }}</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-3 items-center">
        <div class="filter-pill" style="width:180px">
          <span class="filter-pill-text" id="sevText">All severities</span>
          <span class="filter-pill-chevron">▾</span>
          <select class="filter-pill-select" (change)="filterSeverity($event); updateFilterText('sevText', $event)">
            <option value="">All severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div class="filter-pill" style="width:160px">
          <span class="filter-pill-text" id="statText">All statuses</span>
          <span class="filter-pill-chevron">▾</span>
          <select class="filter-pill-select" (change)="filterStatus($event); updateFilterText('statText', $event)">
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div class="filter-pill" style="width:160px">
          <span class="filter-pill-text" id="modText">All modules</span>
          <span class="filter-pill-chevron">▾</span>
          <select class="filter-pill-select" (change)="filterModule($event); updateFilterText('modText', $event)">
            <option value="">All modules</option>
            <option value="auth">Auth</option>
            <option value="payments">Payments</option>
            <option value="dashboard">Dashboard</option>
            <option value="ui">UI</option>
            <option value="api">API</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button class="btn btn-ghost" (click)="loadBugs()">
          ↻ Refresh
        </button>
      </div>

      <!-- Bug List -->
      <div class="flex flex-col gap-2">
        @if (loading()) {
          <div class="text-center py-12 text-[var(--muted-foreground)]">Loading bugs...</div>
        }
        @if (!loading() && bugs().length === 0) {
          <div class="text-center py-12 text-[var(--muted-foreground)]">No bugs found.</div>
        }
        @for (bug of bugs(); track $index) {
          <div
            (click)="router.navigate(['/bugs', bug.id])"
            class="card cursor-pointer transition-all hover:border-gray-400 flex gap-4"
            style="padding:16px;border-radius:12px"
          >
            <div class="flex-1 min-w-0 flex flex-col gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="badge" [ngClass]="severityClass(bug.severity)">
                  {{ bug.severity }}
                </span>
                <span class="badge badge-module">
                  {{ bug.module }}
                </span>
                @if (bug.is_duplicate) {
                  <span class="badge" style="background:#FEF9C3;color:#A16207">duplicate</span>
                }
              </div>
              <p class="text-[var(--foreground)] font-semibold truncate" style="font-size:15px;line-height:1.4">
                {{ bug.title || bug.raw_description }}
              </p>
              <p class="text-[var(--muted-foreground)]" style="font-size:13px;line-height:1.4">
                {{ bug.ai_summary }}
              </p>
            </div>
            <div class="text-right shrink-0 flex flex-col gap-2 items-end justify-between">
              <span class="badge" [ngClass]="statusClass(bug.status)">
                {{ bug.status }}
              </span>
              <span style="color:#9CA3AF;font-size:12px;line-height:1.4">
                {{ bug.created_at | date:'MMM d, h:mm a' }}
              </span>
              @if (bug.browser) {
                <span style="color:#9CA3AF;font-size:11px;line-height:1.4">
                  {{ bug.browser }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      <app-bug-widget />
    </div>
  `,
})
export class Dashboard implements OnInit, OnDestroy {
  router = inject(Router);
  private bugService = inject(BugService);

  bugs = signal<Bug[]>([]);
  loading = signal(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  filters: { severity?: string; status?: string; module?: string } = {};

  ngOnInit() {
    this.loadBugs();
    this.intervalId = setInterval(() => this.loadBugs(), 5000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadBugs() {
    this.loading.set(true);
    this.bugService.getBugs(this.filters).subscribe({
      next: (bugs) => {
        this.bugs.set(bugs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateFilterText(id: string, e: Event) {
    const el = document.getElementById(id);
    if (el) {
      const val = (e.target as HTMLSelectElement).value;
      el.textContent = val || (id === 'sevText' ? 'All severities' : id === 'statText' ? 'All statuses' : 'All modules');
    }
  }

  filterSeverity(e: Event) {
    this.filters.severity = (e.target as HTMLSelectElement).value || undefined;
    this.loadBugs();
  }

  filterStatus(e: Event) {
    this.filters.status = (e.target as HTMLSelectElement).value || undefined;
    this.loadBugs();
  }

  filterModule(e: Event) {
    this.filters.module = (e.target as HTMLSelectElement).value || undefined;
    this.loadBugs();
  }

  countBySeverity(severity: string) {
    return this.bugs().filter(b => b.severity === severity).length;
  }

  countByStatus(status: string) {
    return this.bugs().filter(b => b.status === status).length;
  }

  severityClass(severity?: string) {
    const s = severity?.toLowerCase();
    return {
      'badge-critical': s === 'critical',
      'badge-high': s === 'high',
      'badge-medium': s === 'medium',
      'badge-low': s === 'low',
    };
  }

  statusClass(status?: string) {
    const s = status?.toLowerCase();
    return {
      'badge-open': s === 'open',
      'badge-in-progress': s === 'in progress',
      'badge-resolved': s === 'resolved',
      'badge-closed': s === 'closed',
    };
  }
}
