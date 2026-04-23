import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BugService } from '../../core/services/bug-service';
import { Bug } from '../../core/models/bug';

@Component({
  selector: 'app-bug-detail',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">

      <!-- Back -->
      <button
        (click)="router.navigate(['/dashboard'])"
        class="text-gray-500 hover:text-gray-900 text-sm mb-6 flex items-center gap-2"
      >
        ← Back to dashboard
      </button>
      @if (loading()) {
        <div class="text-gray-500 text-center py-12">
          Loading...
        </div>
      }
      @if (bug()) {
        <div>

          <!-- Header -->
          <div class="flex justify-between items-start mb-6 gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="px-3 py-1 rounded-full text-sm font-medium"
                  [ngClass]="severityClass(bug()!.severity)">
                  {{ bug()!.severity }}
                </span>
                <span class="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                  {{ bug()!.module }}
                </span>
                @if (bug()!.is_duplicate){
                  <span class="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-600">
                    possible duplicate
                  </span>
                }
              </div>
              <h1 class="text-gray-900 text-2xl font-bold">{{ bug()!.title }}</h1>
              <p class="text-gray-500 text-sm mt-1">
                Reported {{ bug()!.created_at | date:'MMM d, y h:mm a' }}
                @if (bug()!.reporter_name){
                  <span> by {{ bug()!.reporter_name }}</span>
                }
              </p>
            </div>

            <!-- Cambiar estado -->
            <select
              [value]="bug()!.status"
              (change)="updateStatus($event)"
              class="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="Open">Open</option>
              <option value="In_progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div class="grid grid-cols-3 gap-6">

            <!-- Columna izquierda — 2/3 -->
            <div class="col-span-2 space-y-6">

              <!-- Descripción original -->
              <div class="bg-white rounded-xl p-5 border border-gray-200">
                <h2 class="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  User report
                </h2>
                <p class="text-gray-900">{{ bug()!.raw_description }}</p>
              </div>

              <!-- Resumen IA -->
              <div class="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <h2 class="text-blue-600 text-xs uppercase tracking-wider mb-3">
                  AI Summary
                </h2>
                <p class="text-gray-900">{{ bug()!.ai_summary }}</p>
                <div class="mt-3 flex items-center gap-2">
                  <span class="text-gray-500 text-xs">AI confidence</span>
                  <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      class="bg-blue-500 h-1.5 rounded-full"
                      [style.width.%]="bug()!.ai_confidence"
                    ></div>
                  </div>
                  <span class="text-blue-600 text-xs">{{ bug()!.ai_confidence }}%</span>
                </div>
              </div>

              <!-- Pasos de reproducción -->
              <div class="bg-white rounded-xl p-5 border border-gray-200">
                <h2 class="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  Reproduction steps
                </h2>
                <p class="text-gray-900 whitespace-pre-line">{{ bug()!.reproduction_steps }}</p>
              </div>

              <!-- Fix sugerido -->
              <div class="bg-green-50 rounded-xl p-5 border border-green-200">
                <h2 class="text-green-600 text-xs uppercase tracking-wider mb-3">
                  Suggested fix
                </h2>
                <p class="text-gray-900">{{ bug()!.suggested_fix }}</p>
              </div>

            </div>

            <!-- Columna derecha — 1/3 -->
            <div class="space-y-4">

              <!-- Contexto del browser -->
              <div class="bg-white rounded-xl p-5 border border-gray-200">
                <h2 class="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  Browser context
                </h2>
                <div class="space-y-2">
                  @if (bug()!.browser) {
                    <div>
                      <p class="text-gray-400 text-xs">Browser</p>
                      <p class="text-gray-900 text-sm">{{ bug()!.browser }}</p>
                    </div>
                  }
                  @if (bug()!.operating_system) {
                    <div>
                      <p class="text-gray-400 text-xs mt-2">Operating System</p>
                      <p class="text-gray-900 text-sm">{{ bug()!.operating_system }}</p>
                    </div>
                  }
                  @if (bug()!.current_url) {
                    <div>
                      <p class="text-gray-400 text-xs mt-2">URL</p>
                      <p class="text-gray-900 text-sm break-all">{{ bug()!.current_url }}</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Info del reporter -->
              <div class="bg-white rounded-xl p-5 border border-gray-200">
                <h2 class="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  Reporter
                </h2>
                <p class="text-gray-900 text-sm">
                  {{ bug()!.reporter_name || 'Anonymous' }}
                </p>
                @if (bug()!.reporter_email) {
                  <p class="text-gray-500 text-xs mt-1">
                    {{ bug()!.reporter_email }}
                  </p>
                }
                @if (bug()!.source_app) {
                  <p class="text-gray-400 text-xs mt-2">
                    via {{ bug()!.source_app }}
                  </p>
                }
              </div>

              <!-- Duplicate warning -->
              @if(bug()!.is_duplicate) {
                <div class="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                  <h2 class="text-yellow-600 text-xs uppercase tracking-wider mb-2">
                    Possible duplicate
                  </h2>
                  <p class="text-gray-700 text-sm">
                    This bug may already be reported.
                  </p>
                  <button
                    *ngIf="bug()!.duplicate_of_id"
                    (click)="router.navigate(['/bugs', bug()!.duplicate_of_id])"
                    class="mt-2 text-yellow-600 text-xs hover:underline"
                  >
                    View original →
                  </button>
                </div>
              }

            </div>
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

  updateStatus(e: Event) {
    const status = (e.target as HTMLSelectElement).value;
    const id = this.bug()!.id;
    this.bugService.updateStatus(id, status).subscribe({
      next: (updated) => this.bug.set(updated),
    });
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
}
