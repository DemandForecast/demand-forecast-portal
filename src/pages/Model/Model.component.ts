import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

// ── API Response Shape ──────────────────────────────────────────────────────

export interface ModelAccuracyMetrics {
  forecastAccuracy: number;
  mae: number;
  mape: number;
  r2Score: number;
  rmse: number;
  smape: number;
}

export interface ModelStatusResponse {
  featureSummary: {
    candidateFeatureCount: number;
    engineeredFeatures: string[];
    inputFeatures: string[];
    modelCategories: string[];
    modelRegions: string[];
    nominalEncodedFeatures: string[];
    seasonalityValues: string[];
    selectedFeatureCount: number;
    weatherValues: string[];
  };
  interpretability: {
    explainedModelComponent: string;
    note: string;
    xaiMethod: string;
  };
  modelAccuracy: {
    ensemble: ModelAccuracyMetrics;
    lstm: ModelAccuracyMetrics;
    xgboost: ModelAccuracyMetrics;
  };
  modelComponents: {
    ensemble: {
      intercept: number;
      lstmCoefficient: number;
      metaLearner: string;
      name: string;
      purpose: string;
      xgboostCoefficient: number;
    };
    lstm: {
      architecture: string[];
      name: string;
      purpose: string;
    };
    xgboost: {
      name: string;
      purpose: string;
    };
  };
  modelInformation: {
    datasetName: string;
    modelName: string;
    modelVersion: string;
    targetVariable: string;
    trainedAt: string;
    trainingSplit: { test: string; train: string; validation: string };
  };
  modelLoadingStatus: {
    encoderLoaded: boolean;
    ensembleLoaded: boolean;
    lstmLoaded: boolean;
    scalerLoaded: boolean;
    targetScalerLoaded: boolean;
    xgboostLoaded: boolean;
  };
  notes: string[];
  service: {
    checkedAt: string;
    name: string;
    status: string;
  };
}

// ── Derived view-model used in the template ─────────────────────────────────

export interface SubModelCard {
  key: 'ensemble' | 'lstm' | 'xgboost';
  name: string;
  shortName: string;
  purpose: string;
  icon: string;
  accentColor: string;
  gradientClass: string;
  metrics: ModelAccuracyMetrics;
  coefficient?: number;
  isBest: boolean;
}

@Component({
  standalone: true,
  selector: 'app-Model',
  imports: [
    CommonModule,
    HttpClientModule,
    ButtonModule,
    CardModule,
    TagModule,
    ChartModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    BadgeModule,
    InputTextModule,
    SkeletonModule,
  ],
  templateUrl: './Model.component.html',
  host: {
    class: 'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6',
  },
  styleUrl: './Model.component.scss',
})
export class ModelComponent implements OnInit, OnDestroy {
  readonly API_URL = 'https://forecast.smartstockflow.co.uk/api/v1/model/status';

  // ── State ──────────────────────────────────────────────────────────────────
  data: ModelStatusResponse | null = null;
  loading = true;
  error: string | null = null;
  lastRefreshed: Date | null = null;
  isRefreshing = false;

  // ── Derived ────────────────────────────────────────────────────────────────
  subModels: SubModelCard[] = [];
  loadingStatusItems: { label: string; key: keyof ModelStatusResponse['modelLoadingStatus'] }[] = [
    { label: 'LSTM Model', key: 'lstmLoaded' },
    { label: 'XGBoost Model', key: 'xgboostLoaded' },
    { label: 'Ensemble', key: 'ensembleLoaded' },
    { label: 'Scaler', key: 'scalerLoaded' },
    { label: 'Target Scaler', key: 'targetScalerLoaded' },
    { label: 'Encoder', key: 'encoderLoaded' },
  ];

  // ── Polling ────────────────────────────────────────────────────────────────
  private pollSub?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
    // Auto-refresh every 60 seconds
    this.pollSub = interval(60_000).subscribe(() => this.fetchData(true));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  fetchData(silent = false): void {
    if (!silent) this.loading = true;
    this.isRefreshing = true;
    this.error = null;

    this.http.get<ModelStatusResponse>(this.API_URL).subscribe({
      next: (res) => {
        this.data = res;
        this.buildSubModels(res);
        this.lastRefreshed = new Date();
        this.loading = false;
        this.isRefreshing = false;
      },
      error: (err) => {
        this.error = 'Failed to reach the model service. Please try again.';
        this.loading = false;
        this.isRefreshing = false;
      },
    });
  }

  private buildSubModels(res: ModelStatusResponse): void {
    const best = (a: ModelAccuracyMetrics, b: ModelAccuracyMetrics) =>
      a.forecastAccuracy >= b.forecastAccuracy && a.mae <= b.mae;

    const ensembleBest =
      best(res.modelAccuracy.ensemble, res.modelAccuracy.lstm) &&
      best(res.modelAccuracy.ensemble, res.modelAccuracy.xgboost);

    const xgbBest =
      !ensembleBest &&
      best(res.modelAccuracy.xgboost, res.modelAccuracy.lstm);

    this.subModels = [
      {
        key: 'ensemble',
        name: res.modelComponents.ensemble.name,
        shortName: 'Ensemble',
        purpose: res.modelComponents.ensemble.purpose,
        icon: 'pi-objects-column',
        accentColor: '#6366f1',
        gradientClass: 'from-indigo-500 to-purple-600',
        metrics: res.modelAccuracy.ensemble,
        coefficient: res.modelComponents.ensemble.xgboostCoefficient,
        isBest: ensembleBest,
      },
      {
        key: 'xgboost',
        name: res.modelComponents.xgboost.name,
        shortName: 'XGBoost',
        purpose: res.modelComponents.xgboost.purpose,
        icon: 'pi-chart-bar',
        accentColor: '#10b981',
        gradientClass: 'from-emerald-500 to-teal-600',
        metrics: res.modelAccuracy.xgboost,
        isBest: xgbBest,
      },
      {
        key: 'lstm',
        name: res.modelComponents.lstm.name,
        shortName: 'LSTM',
        purpose: res.modelComponents.lstm.purpose,
        icon: 'pi-wave-pulse',
        accentColor: '#f59e0b',
        gradientClass: 'from-amber-500 to-orange-500',
        metrics: res.modelAccuracy.lstm,
        isBest: false,
      },
    ];
  }

  // ── Template Helpers ───────────────────────────────────────────────────────

  get serviceStatusSeverity(): 'success' | 'danger' | 'warning' | 'info' {
    const s = this.data?.service?.status?.toUpperCase();
    if (s === 'READY') return 'success';
    if (s === 'ERROR') return 'danger';
    if (s === 'LOADING') return 'warning';
    return 'info';
  }

  get allComponentsLoaded(): boolean {
    if (!this.data) return false;
    return Object.values(this.data.modelLoadingStatus).every(Boolean);
  }

  get loadedCount(): number {
    if (!this.data) return 0;
    return Object.values(this.data.modelLoadingStatus).filter(Boolean).length;
  }

  get totalComponents(): number {
    if (!this.data) return 0;
    return Object.keys(this.data.modelLoadingStatus).length;
  }

  isComponentLoaded(key: keyof ModelStatusResponse['modelLoadingStatus']): boolean {
    return this.data?.modelLoadingStatus?.[key] ?? false;
  }

  r2Percentage(r2: number): number {
    // R2 can be negative; clamp to [0,100] for progress bar display
    return Math.max(0, Math.min(100, r2 * 100));
  }

  r2Color(r2: number): string {
    if (r2 >= 0.7) return '#10b981';
    if (r2 >= 0.4) return '#3b82f6';
    if (r2 >= 0.2) return '#f59e0b';
    return '#ef4444';
  }

  accuracyColor(acc: number): string {
    if (acc >= 60) return '#10b981';
    if (acc >= 45) return '#3b82f6';
    if (acc >= 30) return '#f59e0b';
    return '#ef4444';
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  refreshData(): void {
    this.fetchData();
  }
}
