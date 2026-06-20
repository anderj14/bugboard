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
    <div class="flex flex-col gap-6 items-center">

      <!-- Header -->
      <div class="flex flex-col gap-1">
        <h1 class="text-[var(--foreground)] font-bold" style="font-size:24px;line-height:1.2">Report a Bug</h1>
        <p class="text-[var(--muted-foreground)] text-sm" style="line-height:1.4">
          Describe the bug in your own words — AI will classify it
        </p>
      </div>

      <!-- Success -->
      @if (submitted) {
        <div class="card p-8 text-center flex flex-col gap-6" style="width:640px;max-width:100%;background:var(--color-success);border-color:var(--color-success-foreground)">
          <div class="text-5xl">✅</div>
          <div class="flex flex-col gap-2">
            <h2 class="text-[var(--foreground)] text-xl font-bold">Bug reported successfully</h2>
            <p class="text-[var(--muted-foreground)]">AI classified it as:</p>
            <div class="flex justify-center gap-2">
              <span class="badge" [ngClass]="severityClass(lastBug?.severity)">{{ lastBug?.severity }}</span>
              <span class="badge badge-module">{{ lastBug?.module }}</span>
            </div>
          </div>
          <div class="flex gap-3 justify-center">
            <button class="btn btn-primary" (click)="router.navigate(['/bugs', lastBug?.id])">
              View bug detail
            </button>
            <button class="btn btn-secondary" (click)="submitted = false; form.reset()">
              Report another
            </button>
          </div>
        </div>
      }

      <!-- Form -->
      @if (!submitted) {
        <form [formGroup]="form" (ngSubmit)="submit()" class="card flex flex-col gap-6" style="width:640px;max-width:100%;padding:32px">

          <!-- Description -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[var(--foreground)] text-sm font-medium" style="line-height:1.4">
              What went wrong? *
            </label>
            <textarea
              formControlName="description"
              placeholder="Describe the bug in your own words. The more detail the better..."
              class="w-full resize-none focus:outline-none"
              style="height:140px;border-radius:12px;background:#F9FAFB;border:1px solid var(--card-border);color:var(--foreground);padding:12px 16px;font-size:14px;line-height:1.5;font-family:inherit"
            ></textarea>

            @if (preview) {
              <div class="flex gap-3 items-center" style="border-radius:12px;background:#FFF7ED;border:1px solid #FED7AA;padding:12px 16px">
                <span style="font-size:18px;line-height:1">🤖</span>
                <div class="flex flex-col gap-1">
                  <span style="color:#C2410C;font-size:13px;font-weight:500;line-height:1.3">AI Preview</span>
                  <div class="flex gap-2 flex-wrap items-center">
                    <span class="badge" [ngClass]="severityClass(preview?.severity)">{{ preview?.severity }}</span>
                    <span class="badge badge-module">{{ preview?.module }}</span>
                    <span class="text-sm" style="color:#9A3412;line-height:1.4">{{ preview?.ai_summary }}</span>
                  </div>
                </div>
              </div>
            }

            @if (classifying) {
              <div class="flex items-center gap-2 text-xs" style="color:#C2410C">
                <span class="animate-pulse">AI is analyzing...</span>
              </div>
            }
          </div>

          <!-- Name + Email -->
          <div class="flex gap-4">
            <div class="flex-1 flex flex-col gap-1.5">
              <label class="text-[var(--foreground)] text-sm font-medium" style="line-height:1.4">Your name</label>
              <input
                formControlName="name"
                type="text"
                placeholder="Anderson"
                class="w-full focus:outline-none"
                style="height:40px;border-radius:12px;background:#F9FAFB;border:1px solid var(--card-border);color:var(--foreground);padding:0 16px;font-size:14px;font-family:inherit"
              />
            </div>
            <div class="flex-1 flex flex-col gap-1.5">
              <label class="text-[var(--foreground)] text-sm font-medium" style="line-height:1.4">Email</label>
              <input
                formControlName="email"
                type="email"
                placeholder="anderson@example.com"
                class="w-full focus:outline-none"
                style="height:40px;border-radius:12px;background:#F9FAFB;border:1px solid var(--card-border);color:var(--foreground);padding:0 16px;font-size:14px;font-family:inherit"
              />
            </div>
          </div>

          <!-- Source app -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[var(--foreground)] text-sm font-medium" style="line-height:1.4">App name</label>
            <input
              formControlName="sourceApp"
              type="text"
              placeholder="my-app"
              class="w-full focus:outline-none"
              style="height:40px;border-radius:12px;background:#F9FAFB;border:1px solid var(--card-border);color:var(--foreground);padding:0 16px;font-size:14px;font-family:inherit"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="form.invalid || loading"
            class="btn btn-primary w-full justify-center"
            style="height:48px;font-weight:600"
          >
            {{ loading ? 'Sending to AI...' : 'Submit Bug Report' }}
          </button>

          <p class="text-center text-xs text-[var(--muted-foreground)]" style="line-height:1.4">
            Browser context captured automatically
          </p>
        </form>
      }

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
      'badge-critical': s === 'critical',
      'badge-high': s === 'high',
      'badge-medium': s === 'medium',
      'badge-low': s === 'low',
    };
  }
}
