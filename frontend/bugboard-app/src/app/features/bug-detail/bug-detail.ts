import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BugService } from '../../core/services/bug-service';
import { Bug } from '../../core/models/bug';

@Component({
  selector: 'app-bug-detail',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">
      <button (click)="router.navigate(['/dashboard'])"
        class="text-[var(--primary)] text-sm font-medium self-start cursor-pointer bg-transparent border-none"
        style="line-height:1.4">
        ← Back to dashboard
      </button>

      @if (loading()) {
        <div class="text-center py-12 text-[var(--muted-foreground)]">Loading...</div>
      }

      @if (bug()) {
        <div class="card flex flex-col gap-6" style="padding:32px">

          <!-- Header -->
          <div class="flex justify-between items-center gap-4">
            <h1 class="text-[var(--foreground)] font-bold" style="font-size:22px;line-height:1.2">{{ bug()!.title }}</h1>
            <span class="badge" [ngClass]="statusClass(bug()!.status)" style="padding:6px 14px"
              (click)="cycleStatus()" role="button"
            >{{ bug()!.status }}</span>
          </div>

          <!-- Tags -->
          <div class="flex gap-2">
            <span class="badge" [ngClass]="severityClass(bug()!.severity)">{{ bug()!.severity }}</span>
            <span class="badge badge-module">{{ bug()!.module }}</span>
            @if (bug()!.is_duplicate) {
              <span class="badge" style="background:#FEF9C3;color:#A16207">possible duplicate</span>
            }
          </div>

          <!-- Description -->
          <div class="flex flex-col gap-2">
            <h2 class="text-[var(--foreground)] font-semibold" style="font-size:16px;line-height:1.3">Description</h2>
            <p class="text-[var(--muted-foreground)]" style="font-size:14px;line-height:1.6;width:100%">{{ bug()!.raw_description }}</p>
          </div>

          <!-- Reproduction Steps -->
          <div class="flex flex-col gap-2">
            <h2 class="text-[var(--foreground)] font-semibold" style="font-size:16px;line-height:1.3">Reproduction Steps</h2>
            <p class="text-[var(--muted-foreground)] whitespace-pre-line" style="font-size:14px;line-height:1.6;width:100%">{{ bug()!.reproduction_steps }}</p>
          </div>

          <!-- Suggested Fix -->
          <div class="flex flex-col gap-2">
            <h2 class="text-[var(--foreground)] font-semibold" style="font-size:16px;line-height:1.3">Suggested Fix</h2>
            <p class="text-[var(--muted-foreground)]" style="font-size:14px;line-height:1.6;width:100%">{{ bug()!.suggested_fix }}</p>
          </div>

          <!-- Meta row: Browser Context | Module/Reporter | Duplicate -->
          <div class="flex gap-6 p-4 rounded-xl" style="background:#F9FAFB; padding:22px">

            <!-- Browser Context -->
            <div class="flex-1 flex flex-col gap-1">
              <p class="text-[var(--muted-foreground)] text-xs font-medium uppercase tracking-wider mb-1">Browser Context</p>
              @if (bug()!.browser) {
                <p class="text-xs text-gray-400">Browser</p>
                <p class="text-sm text-[var(--foreground)]">{{ bug()!.browser }}</p>
              }
              @if (bug()!.operating_system) {
                <p class="text-xs text-gray-400">OS</p>
                <p class="text-sm text-[var(--foreground)]">{{ bug()!.operating_system }}</p>
              }
              @if (bug()!.current_url) {
                <p class="text-xs text-gray-400">URL</p>
                <p class="text-sm text-[var(--foreground)] break-all">{{ bug()!.current_url }}</p>
              }
            </div>

            <!-- Reporter -->
            <div class="flex-1 flex flex-col gap-1">
              <p class="text-[var(--muted-foreground)] text-xs font-medium uppercase tracking-wider mb-1">Reporter</p>
              <p class="text-sm text-[var(--foreground)]">{{ bug()!.reporter_name || 'Anonymous' }}</p>
              @if (bug()!.reporter_email) {
                <p class="text-xs text-[var(--muted-foreground)]">{{ bug()!.reporter_email }}</p>
              }
              @if (bug()!.source_app) {
                <p class="text-xs text-gray-400">via {{ bug()!.source_app }}</p>
              }
              <p class="text-xs text-gray-400" style="margin-top:4px">
                Reported {{ bug()!.created_at | date:'MMM d, y h:mm a' }}
              </p>
            </div>

            <!-- Duplicate -->
            @if (bug()!.is_duplicate) {
              <div class="flex-1 flex flex-col gap-1 p-3 rounded-xl" style="background:#FEF9C3;border:1px solid #FDE68A">
                <p class="text-xs font-medium uppercase tracking-wider" style="color:#A16207">Possible duplicate</p>
                @if (bug()!.duplicate_of_id) {
                  <button (click)="router.navigate(['/bugs', bug()!.duplicate_of_id])"
                    class="text-sm font-medium self-start cursor-pointer bg-transparent border-none p-0"
                    style="color:#A16207">
                    View original →
                  </button>
                }
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
})
export class BugDetail implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private bugService = inject(BugService);

  bug = signal<Bug | null>(null);
  loading = signal(true);

  private statusOrder = ['Open', 'In Progress', 'Resolved', 'Closed'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.bugService.getBugById(id).subscribe({
      next: (bug) => {
        this.bug.set(bug);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cycleStatus() {
    const current = this.bug()!.status;
    const idx = this.statusOrder.indexOf(current);
    const next = this.statusOrder[(idx + 1) % this.statusOrder.length];
    this.bugService.updateStatus(this.bug()!.id, next).subscribe({
      next: (updated) => this.bug.set(updated),
    });
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
