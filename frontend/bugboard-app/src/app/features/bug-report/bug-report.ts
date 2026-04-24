import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BugService } from '../../core/services/bug-service';
import { BugContext } from '../../core/models/bug-content';

@Component({
  selector: 'app-bug-report',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div class="w-full max-w-2xl">

        <!-- Header -->
        <div class="mb-8">
          <button
            (click)="router.navigate(['/dashboard'])"
            class="text-gray-500 hover:text-gray-800 text-sm mb-4 flex items-center gap-2"
          >
            ← Back to dashboard
          </button>
          <h1 class="text-gray-900 text-3xl font-bold">🐛 Report a Bug</h1>
          <p class="text-gray-500 text-sm mt-1">
            Describe the bug in your own words — AI will classify it automatically
          </p>
        </div>

        <!-- Success -->
        @if (submitted) {
          <div class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div class="text-5xl mb-4">✅</div>
            <h2 class="text-gray-900 text-xl font-bold mb-2">Bug reported successfully</h2>
            <p class="text-gray-500 mb-2">AI classified it as:</p>
            <div class="flex justify-center gap-2 mb-6">
              <span class="px-3 py-1 rounded-full text-sm font-medium"
                [ngClass]="severityClass(lastBug?.severity)">
                {{ lastBug?.severity }}
              </span>
              <span class="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                {{ lastBug?.module }}
              </span>
            </div>
            <div class="flex gap-3 justify-center">
              <button
                (click)="router.navigate(['/bugs', lastBug?.id])"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                View bug detail
              </button>
              <button
                (click)="submitted = false; form.reset()"
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Report another
              </button>
            </div>
          </div>
        }


        <!-- Form -->
        <form *ngIf="!submitted" [formGroup]="form" (ngSubmit)="submit()"
          class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-5">

          <!-- Description -->
          <div>
            <label class="text-gray-700 text-sm mb-2 block font-medium">
              What went wrong? *
            </label>
            <textarea
              formControlName="description"
              rows="5"
              placeholder="Describe the bug in your own words. The more detail the better..."
              class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder-gray-400"
            ></textarea>

            <!-- AI preview en tiempo real -->
             @if(preview) {
              <div class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p class="text-gray-500 text-xs mb-2">AI preview:</p>
                <div class="flex gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="severityClass(preview?.severity)">
                    {{ preview?.severity }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {{ preview?.module }}
                  </span>
                  <span class="text-gray-500 text-xs self-center">
                    {{ preview?.ai_summary }}
                  </span>
                </div>
              </div>
             }

             @if(classifying) {
              <div class="mt-2 text-gray-400 text-xs animate-pulse">
                AI is analyzing...
              </div>
            }
          </div>

          <!-- Name + Email -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-gray-700 text-sm mb-2 block">Your name</label>
              <input
                formControlName="name"
                type="text"
                placeholder="Anderson"
                class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label class="text-gray-700 text-sm mb-2 block">Email</label>
              <input
                formControlName="email"
                type="email"
                placeholder="anderson@example.com"
                class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
              />
            </div>
          </div>

          <!-- Source app -->
          <div>
            <label class="text-gray-700 text-sm mb-2 block">App name</label>
            <input
              formControlName="sourceApp"
              type="text"
              placeholder="my-app"
              class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="form.invalid || loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm font-medium transition-colors"
          >
            {{ loading ? 'Sending to AI...' : 'Submit Bug Report' }}
          </button>

          <p class="text-gray-400 text-xs text-center">
            Browser context captured automatically
          </p>
        </form>
      </div>
    </div>
  `,
})
export class BugReport {
  router = inject(Router);
  private bugService = inject(BugService);
  private fb = inject(FormBuilder);

  loading = false;
  submitted = false;
  classifying = false;
  preview: any = null;
  lastBug: any = null;

  form = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(10)]],
    name: [''],
    email: [''],
    sourceApp: [''],
  });

  constructor() {
    let debounceTimer: any;
    this.form.get('description')!.valueChanges.subscribe((val) => {
      clearTimeout(debounceTimer);
      if (!val || val.length < 10) {
        this.preview = null;
        return;
      }
      this.classifying = true;
      debounceTimer = setTimeout(() => {
        this.bugService.classifyPreview(val).subscribe({
          next: (result) => {
            this.preview = result;
            this.classifying = false;
          },
          error: () => (this.classifying = false),
        });
      }, 600);
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;

    const context: BugContext = {
      browser: navigator.userAgent,
      operating_system: navigator.platform,
      current_url: window.location.href,
      screen_resolution: `${screen.width}x${screen.height}`,
    };

    this.bugService.createBug({
      raw_description: this.form.value.description!,
      reporter_name: this.form.value.name || undefined,
      reporter_email: this.form.value.email || undefined,
      source_app: this.form.value.sourceApp || undefined,
      context,
    }).subscribe({
      next: (bug) => {
        this.lastBug = bug;
        this.submitted = true;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  severityClass(severity?: string) {
    const s = severity?.toLowerCase();
    return {
      'bg-red-500/20 text-red-400': s === 'critical',
      'bg-orange-500/20 text-orange-400': s === 'high',
      'bg-yellow-500/20 text-yellow-400': s === 'medium',
      'bg-green-500/20 text-green-400': s === 'low',
    };
  }
}
