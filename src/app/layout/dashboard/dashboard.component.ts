import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../services/Dashboard.service';
import { DashboardDto } from '../../../dto/Dashboard.dto';
import { HttpClient } from '@angular/common/http';

interface Product {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  sku: string;
  description: string;
  image: string;
  price: number;
  discountPercent: number;
  isPerishable: boolean;
  storeId: string;
  supplierId: string;
  quantity: number;
  deleted: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

interface TransformedProduct {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  price: number;
  currentInventory: number;
  image?: string;
}

interface ForecastSummary {
  forecastDays: number;
  totalPredictedDemand: number;
  averageDailyDemand: number;
  minimumDailyDemand: number;
  maximumDailyDemand: number;
}

interface ForecastItem {
  predictionId: string;
  forecastType: string;
  productId: string;
  image: string;
  fromDate: string;
  toDate: string;
  predictedDate: string;
  demandForecast: number;
  modelName: string;
  summary: ForecastSummary;
  deleted: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

interface ForecastResponse {
  data: ForecastItem[];
  failedCount: number;
  failedPredictions: any[];
  message: string;
  status: boolean;
  successCount: number;
  totalProducts: number;
}

/** Colour palette — one per product slot */
const PRODUCT_COLORS = [
  { border: '#6366F1', bg: 'rgba(99,102,241,0.12)', badge: '#EEF2FF', text: '#4338CA' },
  { border: '#10B981', bg: 'rgba(16,185,129,0.12)', badge: '#ECFDF5', text: '#065F46' },
  { border: '#F59E0B', bg: 'rgba(245,158,11,0.12)', badge: '#FFFBEB', text: '#92400E' },
  { border: '#EF4444', bg: 'rgba(239,68,68,0.12)',  badge: '#FEF2F2', text: '#991B1B' },
  { border: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', badge: '#F5F3FF', text: '#5B21B6' },
];

/** Fallback product images (Unsplash, generic grocery/product shots) */
const FALLBACK_IMAGES: Record<string, string> = {
  'PROD-1': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=64&h=64&fit=crop',
  'PROD-2': 'https://images.unsplash.com/photo-1553546895-531931aa1aa8?w=64&h=64&fit=crop',
  'PROD-3': 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?w=64&h=64&fit=crop',
  'PROD-4': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=64&h=64&fit=crop',
  'PROD-5': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=64&h=64&fit=crop',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    ChartModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    AvatarModule,
    SkeletonModule,
    TooltipModule,
  ],
  providers: [DashboardService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  selectedTime: string = 'Monthly';
  timeOptions: string[] = ['Weekly', 'Monthly', 'Yearly'];
  dateRange: Date[] = [];
  currencySymbol: string = '£';
currencyFormat: string = 'en-GB';

  salesData  = { annual: 0, daily: 0 };
  profitData = { annual: 0, daily: 0 };
  stockData  = { items: 0, value: 0 };
  wastageData = { items: 0, cost: 0 };

  chartData: any;
  chartOptions: any;
  pieData: any;
  pieOptions: any;
  count: any;
  totalStock: any;
  top5Products: TransformedProduct[] = [];
  forecastData: ForecastItem[] = [];

  /** Loading / error states */
  forecastLoading = false;
  forecastError   = false;

  dashboardData: DashboardDto | null = null;

  private readonly FORECAST_API =
    'https://api.smartstockflow.co.uk/DemandFlow-Service/api/Predict/Top5ProductsByUnitSold';

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.getCurrencySettings();
    this.loadDashboardData();
    this.loadTotalInventoryStock();
    this.loadTop5ProductsByStock();
    this.loadForecastData();
  }

  // ─── Currency ────────────────────────────────────────────────────────────────

  getCurrencySettings(): void {
    try {
      this.currencySymbol = localStorage.getItem('selectedCurrency') || 'LKR';
      this.currencyFormat = localStorage.getItem('currencyFormat')   || 'en-LK';
    } catch {
      this.currencySymbol = 'LKR';
      this.currencyFormat = 'en-LK';
    }
  }

  // ─── Dashboard Summary ────────────────────────────────────────────────────────

  loadDashboardData(): void {
    this.dashboardService.getCountProducts().subscribe({
      next: (response) => {
        if (response.body) {
          this.count = response.body;
          this.updateDashboardDisplay();
        } else {
          this.resetDashboardToZero();
        }
      },
      error: () => this.resetDashboardToZero(),
    });
  }

  loadTotalInventoryStock(): void {
    this.dashboardService.getTotalInventoryStock().subscribe({
      next: (response) => {
        if (response.body) {
          this.totalStock = response.body;
        } else {
          this.resetDashboardToZero();
        }
      },
      error: () => this.resetDashboardToZero(),
    });
  }

  loadTop5ProductsByStock(): void {
    this.dashboardService.getTop5ProductsByStock().subscribe({
      next: (response) => {
        if (response.body) {
          const rawData = Array.isArray(response.body)
            ? response.body
            : (response.body as any).data || [];
          this.top5Products = this.transformProductData(rawData);
          this.updateStockDataFromProducts();
          this.updatePieChart();
        } else {
          this.top5Products = [];
          this.updatePieChart();
        }
      },
      error: () => {
        this.top5Products = [];
        this.updatePieChart();
      },
    });
  }

  // ─── Forecast API ─────────────────────────────────────────────────────────────

loadForecastData(): void {
  this.forecastLoading = true;
  this.forecastError = false;

  // Today's date
  const today = new Date();

  // One month after today
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);

  // Format date as YYYY-MM-DD
  const fromDate = today.toISOString().split('T')[0];
  const toDate = nextMonth.toISOString().split('T')[0];

  const payload = {
    fromDate: fromDate,
    toDate: toDate,
    weather: 'Rainy',
    region: 'North',
    seasonality: 'Autumn',
    holiday: false
  };

  this.http.post<ForecastResponse>(this.FORECAST_API, payload).subscribe({
    next: (response) => {
      this.forecastLoading = false;

      if (response?.status && response.data?.length) {
        this.forecastData = response.data.filter(d => !d.deleted);
        this.buildForecastChart();
      } else {
        this.forecastError = true;
        this.initChartData();
      }
    },
    error: () => {
      this.forecastLoading = false;
      this.forecastError = true;
      this.initChartData();
    },
  });
}

  /**
   * Build a multi-dataset line chart from forecast data.
   * Each product gets its own dataset showing daily demand spread over the forecast period.
   */
  buildForecastChart(): void {
    if (!this.forecastData.length) { this.initChartData(); return; }

    // Generate synthetic daily distribution from summary stats
    const labels = this.generateDailyLabels(this.forecastData[0]);

    const datasets = this.forecastData.map((item, idx) => {
      const color = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
      const dailyValues = this.distributeDailyDemand(item, labels.length);

      return {
        label: item.productId,
        data: dailyValues,
        fill: true,
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.45,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: color.border,
      };
    });

    this.chartData = { labels, datasets };

    this.chartOptions = {
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            borderRadius: 4,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 12, family: "'DM Sans', sans-serif" },
            color: '#6B7280',
          },
        },
        tooltip: {
          backgroundColor: '#1F2937',
          titleColor: '#F9FAFB',
          bodyColor: '#D1D5DB',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx: any) =>
              ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)} units`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#9CA3AF',
            font: { size: 11 },
            maxTicksLimit: 10,
          },
        },
        y: {
          grid: { color: 'rgba(156,163,175,0.15)', drawBorder: false },
          ticks: {
            color: '#9CA3AF',
            font: { size: 11 },
            callback: (v: number) => `${v.toFixed(0)}`,
          },
        },
      },
    };
  }

  /** Generate date labels between fromDate and toDate */
  private generateDailyLabels(item: ForecastItem): string[] {
    const from   = new Date(item.fromDate);
    const to     = new Date(item.toDate);
    const labels: string[] = [];
    const cur    = new Date(from);
    while (cur <= to) {
      labels.push(cur.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
      cur.setDate(cur.getDate() + 1);
    }
    return labels;
  }

  /**
   * Distribute total demand across days using a sine-wave pattern
   * so the chart looks realistic rather than flat.
   */
  private distributeDailyDemand(item: ForecastItem, days: number): number[] {
    const { averageDailyDemand, minimumDailyDemand, maximumDailyDemand } = item.summary;
    const amplitude = (maximumDailyDemand - minimumDailyDemand) / 2;
    return Array.from({ length: days }, (_, i) => {
      const wave = Math.sin((i / days) * Math.PI * 2.5) * amplitude * 0.6;
      const noise = (Math.random() - 0.5) * amplitude * 0.25;
      return Math.max(minimumDailyDemand, Math.min(maximumDailyDemand, averageDailyDemand + wave + noise));
    });
  }

  /** Helper: get forecast item for a product */
  getForecastForProduct(productId: string): ForecastItem | undefined {
    return this.forecastData.find(f => f.productId === productId);
  }

  /** Helper: get colour object for an index */
  getProductColor(index: number): typeof PRODUCT_COLORS[0] {
    return PRODUCT_COLORS[index % PRODUCT_COLORS.length];
  }

  /** Helper: return product image URL with fallback */
  getProductImage(product: TransformedProduct, index: number): string {
    if (product.image && product.image.trim() !== '') return product.image;
    const forecast = this.getForecastForProduct(product.productId);
    if (forecast?.image && forecast.image.trim() !== '') return forecast.image;
    return FALLBACK_IMAGES[product.productId]
      || `https://images.unsplash.com/photo-1542838132-92c53300491e?w=64&h=64&fit=crop`;
  }

  // ─── Stock / Inventory helpers ────────────────────────────────────────────────

  transformProductData(products: Product[]): TransformedProduct[] {
    if (!products?.length) return [];
    return products
      .filter(p => !p.deleted)
      .map(p => ({
        productId:        p.productId,
        productName:      p.productName,
        category:         p.category,
        brand:            p.brand,
        price:            p.price,
        currentInventory: p.quantity,
        image:            p.image,
      }))
      .sort((a, b) => b.currentInventory - a.currentInventory)
      .slice(0, 5);
  }

  updateStockDataFromProducts(): void {
    if (this.top5Products?.length) {
      this.stockData = {
        items: this.top5Products.reduce((s, p) => s + p.currentInventory, 0),
        value: this.top5Products.reduce((s, p) => s + p.currentInventory * p.price, 0),
      };
    }
  }

  resetDashboardToZero(): void {
    this.salesData   = { annual: 0, daily: 0 };
    this.profitData  = { annual: 0, daily: 0 };
    this.stockData   = { items: 0, value: 0 };
    this.wastageData = { items: 0, cost: 0 };
    this.top5Products = [];
    this.initChartData();
  }

  updateDashboardDisplay(): void {
    if (this.dashboardData) {
      this.salesData  = { annual: this.dashboardData.AnnualSales || 0, daily: this.dashboardData.DailySales || 0 };
      this.profitData = { annual: this.dashboardData.AnnualProfit || 0, daily: (this.dashboardData.DailySales || 0) * 0.3 };
      this.stockData  = { items: this.dashboardData.StockItems || 0, value: (this.dashboardData.StockItems || 0) * 3000 };
      this.wastageData = { items: this.dashboardData.Wastage || 0, cost: (this.dashboardData.Wastage || 0) * 600 };
      this.initChartData();
    }
  }

  initChartData() {
    const chartLabels = this.getChartLabels();
    const chartValues = this.getChartValues();
    this.chartData = {
      labels: chartLabels,
      datasets: [{
        label: 'Sales 2024', data: chartValues, fill: true,
        borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,0.08)', tension: 0.4,
      }],
    };
    this.chartOptions = {
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx: any) => `${this.currencySymbol} ${this.formatCurrency(ctx.raw)}` } },
      },
      scales: { y: { ticks: { callback: (v: number) => `${this.currencySymbol} ${this.formatCurrency(v)}` } } },
    };
    this.updatePieChart();
  }

  updatePieChart(): void {
    const colors = PRODUCT_COLORS.map(c => c.border);
    if (this.top5Products?.length) {
      this.pieData = {
        labels: this.top5Products.map(p => p.productName || p.productId),
        datasets: [{
          data: this.top5Products.map(p => p.currentInventory),
          backgroundColor: colors.slice(0, this.top5Products.length),
          borderWidth: 3, borderColor: '#ffffff',
        }],
      };
      this.pieOptions = {
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                return ` ${ctx.label}: ${ctx.raw} units (${((ctx.raw / total) * 100).toFixed(1)}%)`;
              },
            },
          },
        },
      };
    } else {
      this.pieData = { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#E5E7EB'], borderWidth: 0 }] };
      this.pieOptions = { plugins: { legend: { display: false }, tooltip: { enabled: false } } };
    }
  }

  getChartLabels(): string[] {
    switch (this.selectedTime) {
      case 'Weekly':  return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'Yearly':  return ['2020', '2021', '2022', '2023', '2024'];
      default: return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    }
  }

  getChartValues(): number[] {
    if (!this.dashboardData) {
      return this.selectedTime === 'Weekly' ? [0,0,0,0] : this.selectedTime === 'Yearly' ? [0,0,0,0,0] : Array(12).fill(0);
    }
    switch (this.selectedTime) {
      case 'Weekly':  return this.dashboardData.WeeklySales || [0,0,0,0];
      case 'Monthly': return this.dashboardData.MonthlySales || Array(12).fill(0);
      case 'Yearly': {
        const m = this.dashboardData.MonthlySales || Array(12).fill(0);
        const t = m.reduce((s, v) => s + v, 0);
        return t > 0 ? [t*.6,t*.7,t*.8,t*.9,t] : [0,0,0,0,0];
      }
      default: return this.dashboardData.MonthlySales || Array(12).fill(0);
    }
  }

  // ─── Formatting / Status helpers ─────────────────────────────────────────────

  formatCurrency(value: number): string {
    return value.toLocaleString(this.currencyFormat);
  }

  getStockStatus(inventory: number): string {
    if (inventory > 200) return 'High Stock';
    if (inventory >= 100) return 'Optimal';
    if (inventory >= 50)  return 'Low Stock';
    return 'Critical';
  }

  getStockSeverity(inventory: number): 'success' | 'info' | 'warning' | 'danger' {
    if (inventory > 200) return 'info';
    if (inventory >= 100) return 'success';
    if (inventory >= 50)  return 'warning';
    return 'danger';
  }

  getStockStatusClass(inventory: number): string {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold';
    if (inventory > 200)  return `${base} bg-blue-100   text-blue-700`;
    if (inventory >= 100) return `${base} bg-green-100  text-green-700`;
    if (inventory >= 50)  return `${base} bg-amber-100  text-amber-700`;
    return `${base} bg-red-100 text-red-700`;
  }

  getTrendArrow(forecast: ForecastItem | undefined): string {
    if (!forecast) return '';
    const { averageDailyDemand, minimumDailyDemand, maximumDailyDemand } = forecast.summary;
    const ratio = (averageDailyDemand - minimumDailyDemand) / (maximumDailyDemand - minimumDailyDemand);
    return ratio > 0.6 ? '↑' : ratio > 0.4 ? '→' : '↓';
  }

  getTrendClass(forecast: ForecastItem | undefined): string {
    if (!forecast) return 'text-gray-400';
    const { averageDailyDemand, minimumDailyDemand, maximumDailyDemand } = forecast.summary;
    const ratio = (averageDailyDemand - minimumDailyDemand) / (maximumDailyDemand - minimumDailyDemand);
    return ratio > 0.6 ? 'text-emerald-500 font-bold' : ratio > 0.4 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold';
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  navigateToReports()     { this.router.navigate(['/report']); }
  navigateToTransaction() { this.router.navigate(['/inventoryhistory']); }
  navigateToProduct()     { this.router.navigate(['/products']); }
  changeSelect()          { this.buildForecastChart(); }
}
