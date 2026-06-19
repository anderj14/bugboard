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
    <div class="min-h-screen bg-gray-50 p-6">

      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-gray-900 text-3xl font-bold">🐛 BugBoard</h1>
          <p class="text-gray-500 text-sm mt-1">AI-powered bug tracking</p>
        </div>
        <button
          (click)="router.navigate(['/report'])"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Report Bug
        </button>
        <button
          (click)="router.navigate(['/metrics'])"
          class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          📊 Metrics
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl p-4 border border-gray-200">
          <p class="text-gray-500 text-xs mb-1">Total Bugs</p>
          <p class="text-gray-900 text-2xl font-bold">{{ bugs().length }}</p>
        </div>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200">
          <p class="text-red-600 text-xs mb-1">Critical</p>
          <p class="text-red-600 text-2xl font-bold">{{ countBySeverity('Critical') }}</p>
        </div>
        <div class="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <p class="text-orange-600 text-xs mb-1">High</p>
          <p class="text-orange-600 text-2xl font-bold">{{ countBySeverity('High') }}</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <p class="text-green-600 text-xs mb-1">Resolved</p>
          <p class="text-green-600 text-2xl font-bold">{{ countByStatus('Resolved') }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-3 mb-6 flex-wrap">
        <select
          (change)="filterSeverity($event)"
          class="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          (change)="filterStatus($event)"
          class="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          (change)="filterModule($event)"
          class="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All modules</option>
          <option value="auth">Auth</option>
          <option value="payments">Payments</option>
          <option value="dashboard">Dashboard</option>
          <option value="ui">UI</option>
          <option value="api">API</option>
          <option value="other">Other</option>
        </select>

        <button
          (click)="loadBugs()"
          class="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm hover:border-blue-500"
        >
          ↻ Refresh
        </button>
      </div>

      <div class="space-y-3">
        @if (loading()) {
          <div class="text-gray-500 text-center py-12">
            Loading bugs...
          </div>
        }
        @if (!loading() && bugs().length === 0) {
          <div class="text-gray-500 text-center py-12">
            No bugs found.
          </div>
        }
        @for (bug of bugs(); track $index) {
          <div
            (click)="router.navigate(['/bugs', bug.id])"
            class="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-4 cursor-pointer transition-all"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="severityClass(bug.severity)">
                    {{ bug.severity }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {{ bug.module }}
                  </span>
                  @if (bug.is_duplicate) {
                    <span
                      class="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-600">
                      duplicate
                    </span>
                  }
                </div>
                <p class="text-gray-900 font-medium truncate">{{ bug.title || bug.raw_description }}</p>
                <p class="text-gray-500 text-xs mt-1">{{ bug.ai_summary }}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="px-2 py-0.5 rounded-full text-xs"
                  [ngClass]="statusClass(bug.status)">
                  {{ bug.status }}
                </span>
                <p class="text-gray-400 text-xs mt-1">
                  {{ bug.created_at | date:'MMM d, h:mm a' }}
                </p>
              </div>
            </div>

            <!-- Contexto del browser -->
             @if (bug.browser) {
              <div class="mt-2 flex gap-3 text-gray-400 text-xs">
                <span>{{ bug.browser }}</span>
                @if (bug.operating_system) {
                  <span>{{ bug.operating_system }}</span>
                }
              </div>
             }

          </div>
        }
      </div>
    </div>

    <!-- Widget flotante -->
    <app-bug-widget />
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
      'bg-red-100 text-red-600': s === 'critical',
      'bg-orange-100 text-orange-600': s === 'high',
      'bg-yellow-100 text-yellow-600': s === 'medium',
      'bg-green-100 text-green-600': s === 'low',
    };
  }

  statusClass(status?: string) {
    const s = status?.toLowerCase();
    return {
      'bg-blue-100 text-blue-600': s === 'open',
      'bg-purple-100 text-purple-600': s === 'in progress',
      'bg-green-100 text-green-600': s === 'resolved',
      'bg-gray-100 text-gray-500': s === 'closed',
    };
  }
}