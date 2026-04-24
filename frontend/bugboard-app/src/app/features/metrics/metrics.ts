import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BugService } from '../../core/services/bug-service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-metrics',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-6">

      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-slate-900 text-3xl font-bold">📊 Metrics</h1>
          <p class="text-slate-500 text-sm mt-1">Bug trends and insights</p>
        </div>
        <button
          (click)="router.navigate(['/dashboard'])"
          class="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1"
        >
          ← Back to dashboard
        </button>
      </div>

      <!-- Summary cards -->
      @if (summary()) {
        <div class="grid grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Total Bugs</p>
            <p class="text-slate-900 text-4xl font-bold">{{ summary().total }}</p>
          </div>
          <div class="bg-white rounded-2xl p-5 border-l-4 border-l-blue-500 border border-slate-200 shadow-sm">
            <p class="text-blue-500 text-xs font-medium uppercase tracking-wider mb-2">Open</p>
            <p class="text-slate-900 text-4xl font-bold">{{ summary().open }}</p>
          </div>
          <div class="bg-white rounded-2xl p-5 border-l-4 border-l-red-500 border border-slate-200 shadow-sm">
            <p class="text-red-500 text-xs font-medium uppercase tracking-wider mb-2">Critical</p>
            <p class="text-slate-900 text-4xl font-bold">{{ summary().critical }}</p>
          </div>
          <div class="bg-white rounded-2xl p-5 border-l-4 border-l-green-500 border border-slate-200 shadow-sm">
            <p class="text-green-500 text-xs font-medium uppercase tracking-wider mb-2">Resolved</p>
            <p class="text-slate-900 text-4xl font-bold">{{ summary().resolved }}</p>
          </div>
        </div>
      }

      <!-- Charts grid -->
      <div class="grid grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 class="text-slate-700 font-semibold mb-1">Bugs by Severity</h2>
          <p class="text-slate-400 text-xs mb-4">Distribution across severity levels</p>
          <div class="h-64">
            <canvas #severityChart></canvas>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 class="text-slate-700 font-semibold mb-1">Bugs by Module</h2>
          <p class="text-slate-400 text-xs mb-4">Which parts of the app have most issues</p>
          <div class="h-64">
            <canvas #moduleChart></canvas>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-slate-700 font-semibold mb-1">Bug Timeline</h2>
        <p class="text-slate-400 text-xs mb-4">Bugs reported over time</p>
        <div class="h-64">
          <canvas #timelineChart></canvas>
        </div>
      </div>

    </div>
  `,
})
export class Metrics implements OnInit, AfterViewInit {
  @ViewChild('severityChart') severityRef!: ElementRef;
  @ViewChild('moduleChart') moduleRef!: ElementRef;
  @ViewChild('timelineChart') timelineRef!: ElementRef;

  router = inject(Router);
  private bugService = inject(BugService);

  summary = signal<any>(null);

  private severityData: any[] = [];
  private moduleData: any[] = [];
  private timelineData: any[] = [];
  private chartsReady = false;
  private charts: { [key: string]: Chart } = {};

  ngOnInit() {
    this.bugService.getMetricsSummary().subscribe(d => this.summary.set(d));

    this.bugService.getMetricsBySeverity().subscribe(d => {
      this.severityData = d;
      this.tryRenderCharts();
    });

    this.bugService.getMetricsByModule().subscribe(d => {
      this.moduleData = d;
      this.tryRenderCharts();
    });

    this.bugService.getMetricsTimeline().subscribe(d => {
      this.timelineData = d;
      this.tryRenderCharts();
    });
  }

  ngAfterViewInit() {
    this.chartsReady = true;
    this.tryRenderCharts();
  }

  tryRenderCharts() {
    if (!this.chartsReady) return;
    if (this.severityData.length) this.renderSeverityChart();
    if (this.moduleData.length) this.renderModuleChart();
    if (this.timelineData.length) this.renderTimelineChart();
  }


  renderSeverityChart() {
    if (this.charts['severity']) this.charts['severity'].destroy();

    this.charts['severity'] = new Chart(this.severityRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.severityData.map(d => d.severity),
        datasets: [{
          data: this.severityData.map(d => d.count),
          backgroundColor: ['#ef4444', '#f97316', '#facc15', '#22c55e'],
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748b',
              boxWidth: 10,
              padding: 12,
            },
          },
        },
      },
    });
  }

  renderModuleChart() {
    if (this.charts['module']) this.charts['module'].destroy();

    this.charts['module'] = new Chart(this.moduleRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.moduleData.map(d => d.module),
        datasets: [{
          label: 'Bugs',
          data: this.moduleData.map(d => d.count),
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          maxBarThickness: 30, // 🔥 controla tamaño barras
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#64748b' },
            grid: { display: false },
          },
          y: {
            ticks: { color: '#64748b' },
            grid: { color: '#e5e7eb' },
          },
        },
      },
    });
  }

  renderTimelineChart() {
    if (this.charts['timeline']) this.charts['timeline'].destroy();

    this.charts['timeline'] = new Chart(this.timelineRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.timelineData.map(d => d.date),
        datasets: [{
          label: 'Bugs reported',
          data: this.timelineData.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#64748b' },
          },
        },
        scales: {
          x: {
            ticks: { color: '#64748b' },
            grid: { display: false },
          },
          y: {
            ticks: { color: '#64748b' },
            grid: { color: '#e5e7eb' },
          },
        },
      },
    });
  }
}