import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { ChartPoint } from '../models/project.model';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [NgIf, MatCardModule],
  template: `
    <section class="card chart-card">
      <header>
        <h3>{{ title }}</h3>
        <span *ngIf="data.length">{{ total }} total</span>
      </header>
      <div class="chart-frame">
        <canvas #canvas></canvas>
        <p class="empty-chart" *ngIf="!data.length">No chart data available.</p>
      </div>
    </section>
  `,
  styles: [`
    .chart-card { min-height: 376px; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    h3 { margin: 0; font-size: 16px; line-height: 1.25; }
    header span { color: #667085; font-size: 12px; font-weight: 800; background: #f1f5f9; border-radius: 999px; padding: 5px 9px; white-space: nowrap; }
    .chart-frame { position: relative; height: 300px; min-height: 300px; }
    canvas { display: block; }
    .empty-chart { position: absolute; inset: 0; display: grid; place-items: center; color: #667085; margin: 0; background: #f8fafc; border-radius: 7px; }
  `]
})
export class ChartCardComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) title = '';
  @Input({ required: true }) data: ChartPoint[] = [];
  @Input() type: 'bar' | 'doughnut' | 'line' = 'bar';
  @Input() horizontal = false;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  get total(): number {
    return this.data.reduce((sum, point) => sum + point.value, 0);
  }

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.render();
  }

  private render(): void {
    if (!this.canvas) return;
    this.chart?.destroy();
    if (!this.data.length) return;
    const labels = this.data.map((point) => point.name);
    const values = this.data.map((point) => point.value);
    const scales = this.type === 'doughnut' ? undefined : this.horizontal
      ? { x: { beginAtZero: true }, y: { ticks: { autoSkip: false } } }
      : { x: { ticks: { autoSkip: false } }, y: { beginAtZero: true } };
    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels,
        datasets: [{
          label: this.title,
          data: values,
          backgroundColor: ['#0b66d8', '#22a06b', '#f5a524', '#e2483d', '#7c3aed', '#00a3bf', '#64748b', '#db2777', '#4d7c0f'],
          borderColor: '#ffffff',
          borderWidth: this.type === 'doughnut' ? 3 : 0,
          borderRadius: this.type === 'bar' ? 5 : 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.horizontal ? 'y' : 'x',
        plugins: {
          legend: { display: this.type === 'doughnut', position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } },
          tooltip: { enabled: true }
        },
        scales
      }
    };
    this.chart = new Chart(this.canvas.nativeElement, config);
  }
}
