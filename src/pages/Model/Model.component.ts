import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

interface ModelStatus {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  accuracy: number;
  uptime: number;
  requestsPerHour: number;
  lastUpdated: string;
  description: string;
  metrics: {
    responseTime: number;
    successRate: number;
    errorRate: number;
  };
  category: string;
  icon: string;
  color: string;
}

@Component({
  standalone: true,
  selector: 'app-Model',
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    ChartModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    BadgeModule,
    IconField,
    InputIcon,
    InputTextModule
  ],
  templateUrl: './Model.component.html',
  host: {
    class: 'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6',
  },
  styleUrl: './Model.component.scss',
})
export class ModelComponent implements OnInit {
  models: ModelStatus[] = [];
  filteredModels: ModelStatus[] = [];
  searchTerm: string = '';

  // Summary statistics
  totalModels: number = 0;
  activeModels: number = 0;
  averageUptime: number = 0;
  totalRequests: number = 0;

  constructor() {}

  ngOnInit() {
    this.loadModelData();
    this.calculateStatistics();
  }

  loadModelData() {
    this.models = [
      {
        id: '1',
        name: 'Neural Language Pro',
        version: 'v4.2.1',
        status: 'active',
        accuracy: 98.5,
        uptime: 99.9,
        requestsPerHour: 15420,
        lastUpdated: '2026-05-14 08:30:00',
        description: 'Advanced natural language processing model with state-of-the-art performance',
        metrics: {
          responseTime: 145,
          successRate: 99.2,
          errorRate: 0.8
        },
        category: 'NLP',
        icon: 'pi-comments',
        color: '#6366f1'
      },
      {
        id: '2',
        name: 'Vision AI Core',
        version: 'v3.8.0',
        status: 'active',
        accuracy: 96.8,
        uptime: 99.5,
        requestsPerHour: 8950,
        lastUpdated: '2026-05-14 09:15:00',
        description: 'Computer vision model for image recognition and object detection',
        metrics: {
          responseTime: 230,
          successRate: 98.5,
          errorRate: 1.5
        },
        category: 'Vision',
        icon: 'pi-eye',
        color: '#8b5cf6'
      },
      {
        id: '3',
        name: 'Sentiment Analyzer',
        version: 'v2.5.3',
        status: 'active',
        accuracy: 94.2,
        uptime: 98.7,
        requestsPerHour: 12300,
        lastUpdated: '2026-05-14 07:45:00',
        description: 'Specialized model for emotion and sentiment analysis in text',
        metrics: {
          responseTime: 98,
          successRate: 97.8,
          errorRate: 2.2
        },
        category: 'NLP',
        icon: 'pi-heart',
        color: '#ec4899'
      },
    ];

    this.filteredModels = [...this.models];
  }

  calculateStatistics() {
    this.totalModels = this.models.length;
    this.activeModels = this.models.filter(m => m.status === 'active').length;
    this.averageUptime = this.models.reduce((sum, m) => sum + m.uptime, 0) / this.models.length;
    this.totalRequests = this.models.reduce((sum, m) => sum + m.requestsPerHour, 0);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = value;

    if (!value) {
      this.filteredModels = [...this.models];
      return;
    }

    this.filteredModels = this.models.filter(model =>
      model.name.toLowerCase().includes(value) ||
      model.category.toLowerCase().includes(value) ||
      model.description.toLowerCase().includes(value) ||
      model.version.toLowerCase().includes(value)
    );
  }

  getStatusSeverity(status: string): string {
    const severityMap: { [key: string]: string } = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
      error: 'danger'
    };
    return severityMap[status] || 'info';
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 98) return '#10b981';
    if (accuracy >= 95) return '#3b82f6';
    if (accuracy >= 90) return '#f59e0b';
    return '#ef4444';
  }

  getUptimeColor(uptime: number): string {
    if (uptime >= 99) return '#10b981';
    if (uptime >= 95) return '#3b82f6';
    if (uptime >= 90) return '#f59e0b';
    return '#ef4444';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  refreshData() {
    this.loadModelData();
    this.calculateStatistics();
    this.onSearch({ target: { value: this.searchTerm } } as any);
  }
}
