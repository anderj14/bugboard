import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { BugContext } from '../../../core/models/bug-content';
import { Bug } from '../../../core/models/bug';
import { BugService } from '../../../core/services/bug-service';


@Component({
  selector: 'app-bug-widget',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50">
      
       @if(!isOpen) {
          <button
            (click)="isOpen = true"
            class="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 text-2xl"
          >
            🐛
          </button>
       }
     

      <!-- widget -->
      @if (isOpen) {
        <div
          class="bg-white border border-gray-200 rounded-2xl shadow-2xl w-96 p-6"
        >
          <!-- Header -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-gray-900 font-semibold text-lg">Report a Bug</h3>
            <button
              (click)="closeWidget()"
              class="text-gray-400 hover:text-gray-700 text-xl"
            >✕</button>
          </div>

          @if (!submitted) {
            <div class="text-center py-8">
              <div class="text-4xl mb-3">✅</div>
              <p class="text-gray-900 font-medium">Bug reported!</p>
              <p class="text-gray-500 text-sm mt-1">Our AI classified it as</p>
              <span class="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium"
                [ngClass]="severityClass(lastBug?.severity)">
                {{ lastBug?.severity }} — {{ lastBug?.module }}
              </span>
              <button
                (click)="submitted = false; isOpen = false"
                class="mt-4 block w-full text-gray-400 text-sm hover:text-gray-700"
              >Close</button>
            </div>
          }


          @if (!submitted) {
            <form [formGroup]="form" (ngSubmit)="submit()">

            <div class="mb-4">
              <label class="text-gray-700 text-sm mb-1 block">
                What went wrong?
              </label>
              <textarea
                formControlName="description"
                rows="4"
                placeholder="Describe the bug in your own words..."
                class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder-gray-400"
              ></textarea>

              @if (preview) {
              <div class="mt-2 flex gap-2 items-center flex-wrap">
                <span class="text-gray-500 text-xs">AI preview:</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="severityClass(preview.severity)">
                  {{ preview.severity }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                  {{ preview.module }}
                </span>
              </div>
              }
              @if (classifying) {
              <div class="mt-2 text-gray-400 text-xs animate-pulse">
                AI is analyzing...
              </div>
              }
            </div>

            <div class="mb-4">
              <label class="text-gray-700 text-sm mb-1 block">Your name (optional)</label>
              <input
                formControlName="name"
                type="text"
                placeholder="Anderson"
                class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
              />
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || loading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm font-medium transition-colors"
            >
              {{ loading ? 'Sending...' : 'Submit Bug Report' }}
            </button>

            <p class="text-gray-400 text-xs mt-3 text-center">
              Browser context captured automatically
            </p>
            </form>
          }
        </div>
      }

    </div>
  `,
})
export class BugWidget implements OnDestroy {
  private bugService = inject(BugService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private descriptionInput$ = new Subject<string>();

  isOpen = false;
  loading = false;
  submitted = false;
  classifying = false;
  preview: Partial<Bug> | null = null;
  lastBug: Bug | null = null;

  form = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(10)]],
    name: [''],
  });

  constructor() {
    this.descriptionInput$
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap((text) => {
          this.classifying = true;
          this.preview = null;
          return this.bugService.classifyPreview(text);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          this.preview = result;
          this.classifying = false;
        },
        error: () => {
          this.classifying = false;
        },
      });

    // listen changes in description input
    this.form.get('description')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val: any) => {
        if (val && val.length >= 10) {
          this.descriptionInput$.next(val);
        } else {
          this.preview = null;
          this.classifying = false;
        }
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
      source_app: 'bugboard-widget',
      context,
    }).subscribe({
      next: (bug) => {
        this.lastBug = bug;
        this.submitted = true;
        this.loading = false;
        this.form.reset();
        this.preview = null;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  closeWidget() {
    this.isOpen = false;
    this.submitted = false;
    this.preview = null;
    this.form.reset();
  }

  severityClass(severity?: string): object {
    const s = severity?.toLowerCase();
    return {
      'bg-red-100 text-red-600': s === 'critical',
      'bg-orange-100 text-orange-600': s === 'high',
      'bg-yellow-100 text-yellow-600': s === 'medium',
      'bg-green-100 text-green-600': s === 'low',
    };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
