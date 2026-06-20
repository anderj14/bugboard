import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { BugService } from '../../core/services/bug-service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-metrics',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">

      <h1 class="text-[var(--foreground)] font-bold" style="font-size:28px;line-height:1.2">Metrics</h1>

      <!-- Chart row -->
      <div class="flex gap-5" style="height:380px">
        <div class="card flex-1 flex flex-col gap-4" style="padding:24px">
          <h2 class="text-[var(--foreground)] font-semibold" style="font-size:18px;line-height:1.3">By Severity</h2>
          <div class="flex-1">
            <canvas #severityChart></canvas>
          </div>
        </div>
        <div class="card flex-1 flex flex-col gap-4" style="padding:24px">
          <h2 class="text-[var(--foreground)] font-semibold" style="font-size:18px;line-height:1.3">By Module</h2>
          <div class="flex-1">
            <canvas #moduleChart></canvas>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <h2 class="text-[var(--foreground)] font-semibold" style="font-size:18px;line-height:1.3">Timeline</h2>
      <div class="card" style="padding:24px;height:160px">
        <canvas #timelineChart></canvas>
      </div>

    </div>
  `,
})
export class Metrics implements OnInit, AfterViewInit {
  @ViewChild('severityChart') severityRef!: ElementRef;
  @ViewChild('moduleChart') moduleRef!: ElementRef;
  @ViewChild('timelineChart') timelineRef!: ElementRef;

  private bugService = inject(BugService);

  private severityData: any[] = [];
  private moduleData: any[] = [];
  private timelineData: any[] = [];
  private chartsReady = false;
  private charts: { [key: string]: Chart } = {};

  ngOnInit() {
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
            labels: { color: '#64748b', boxWidth: 10, padding: 12 },
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
          backgroundColor: '#2563EB',
          borderRadius: 8,
          maxBarThickness: 30,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { display: false } },
          y: { ticks: { color: '#64748b' }, grid: { color: '#e5e7eb' } },
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
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.08)',
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
        plugins: { legend: { labels: { color: '#64748b' } } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { display: false } },
          y: { ticks: { color: '#64748b' }, grid: { color: '#e5e7eb' } },
        },
      },
    });
  }
}
