import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/Dashboard.service';
import { DashboardDto } from '../../../dto/Dashboard.dto';

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
  ],
  providers: [DashboardService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  selectedTime: string = 'Monthly';
  timeOptions: string[] = ['Weekly', 'Monthly', 'Yearly'];
  dateRange: Date[] = [];
  currencySymbol: string = 'LKR';
  currencyFormat: string = 'en-LK';

  salesData = { annual: 0, daily: 0 };
  profitData = { annual: 0, daily: 0 };
  stockData = { items: 0, value: 0 };
  wastageData = { items: 0, cost: 0 };

  chartData: any;
  chartOptions: any;
  pieData: any;
  pieOptions: any;
  count: any;
  totalStock: any;
  top5Products: any[] = [];

  dashboardData: DashboardDto | null = null;

  constructor(
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.getCurrencySettings();
    this.loadDashboardData();
    this.loadTotalInventoryStock();
    this.loadTop5ProductsByStock();
  }

  getCurrencySettings(): void {
    try {
      const storedCurrency = localStorage.getItem('selectedCurrency');
      this.currencySymbol = storedCurrency || 'LKR';

      const storedFormat = localStorage.getItem('currencyFormat');
      this.currencyFormat = storedFormat || 'en-LK';
    } catch {
      this.currencySymbol = 'LKR';
      this.currencyFormat = 'en-LK';
    }
  }

  loadDashboardData(): void {
    this.dashboardService.getCountProducts().subscribe({
      next: (response) => {
        if (response.body) {
          this.count = response.body;
          console.log('Dashboard Data:', this.dashboardData);
          this.updateDashboardDisplay();
        } else {
          this.resetDashboardToZero();
        }
      },
      error: () => {
        this.resetDashboardToZero();
      },
    });
  }

  loadTotalInventoryStock(): void {
    this.dashboardService.getTotalInventoryStock().subscribe({
      next: (response) => {
        if (response.body) {
          this.totalStock = response.body;
          console.log('Total Inventory Stock:', this.totalStock);
        } else {
          this.resetDashboardToZero();
        }
      },
      error: () => {
        this.resetDashboardToZero();
      },
    });
  }

  loadTop5ProductsByStock(): void {
    this.dashboardService.getTop5ProductsByStock().subscribe({
      next: (response) => {
        if (response.body) {
          this.top5Products = response.body.data;
          console.log('Top 5 Products by Stock:', this.top5Products);
          // Update pie chart with new data
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

  resetDashboardToZero(): void {
    this.salesData = { annual: 0, daily: 0 };
    this.profitData = { annual: 0, daily: 0 };
    this.stockData = { items: 0, value: 0 };
    this.wastageData = { items: 0, cost: 0 };
    this.top5Products = [];
    this.initChartData();
  }

  updateDashboardDisplay(): void {
    if (this.dashboardData) {
      this.salesData = {
        annual: this.dashboardData.AnnualSales || 0,
        daily: this.dashboardData.DailySales || 0,
      };

      this.profitData = {
        annual: this.dashboardData.AnnualProfit || 0,
        daily: this.dashboardData.DailySales
          ? this.dashboardData.DailySales * 0.3
          : 0,
      };

      this.stockData = {
        items: this.dashboardData.StockItems || 0,
        value: this.dashboardData.StockItems
          ? this.dashboardData.StockItems * 3000
          : 0,
      };

      this.wastageData = {
        items: this.dashboardData.Wastage || 0,
        cost: this.dashboardData.Wastage ? this.dashboardData.Wastage * 600 : 0,
      };

      this.initChartData();
    }
  }

  initChartData() {
    const chartLabels = this.getChartLabels();
    const chartValues = this.getChartValues();

    this.chartData = {
      labels: chartLabels,
      datasets: [
        {
          label: 'Sales 2024',
          data: chartValues,
          fill: true,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };

    this.chartOptions = {
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${this.currencySymbol} ${this.formatCurrency(
                context.raw
              )}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value: number) => {
              return `${this.currencySymbol} ${this.formatCurrency(value)}`;
            },
          },
        },
      },
    };

    // Initialize pie chart
    this.updatePieChart();
  }

  updatePieChart(): void {
    if (this.top5Products && this.top5Products.length > 0) {
      const labels = this.top5Products.map(
        (product) => product.productName || product.productId
      );
      const data = this.top5Products.map((product) => product.currentInventory);

      // Generate colors for each product
      const colors = ['#3B82F6', '#EC4899', '#14B8A6', '#F59E0B', '#6B7280'];

      this.pieData = {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, this.top5Products.length),
          },
        ],
      };
    } else {
      this.pieData = {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#E5E7EB'],
          },
        ],
      };
    }

    this.pieOptions = {
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.label}: ${context.raw} items`;
            },
          },
        },
      },
    };
  }

  getChartLabels(): string[] {
    switch (this.selectedTime) {
      case 'Weekly':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'Monthly':
        return [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
      case 'Yearly':
        return ['2020', '2021', '2022', '2023', '2024'];
      default:
        return [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
    }
  }

  getChartValues(): number[] {
    if (!this.dashboardData) {
      switch (this.selectedTime) {
        case 'Weekly':
          return [0, 0, 0, 0];
        case 'Monthly':
          return Array(12).fill(0);
        case 'Yearly':
          return [0, 0, 0, 0, 0];
        default:
          return Array(12).fill(0);
      }
    } else {
      switch (this.selectedTime) {
        case 'Weekly':
          return this.dashboardData.WeeklySales || [0, 0, 0, 0];
        case 'Monthly':
          return this.dashboardData.MonthlySales || Array(12).fill(0);
        case 'Yearly':
          const monthlyData =
            this.dashboardData.MonthlySales || Array(12).fill(0);
          const yearlyTotal = monthlyData.reduce((sum, val) => sum + val, 0);
          return yearlyTotal > 0
            ? [
                yearlyTotal * 0.6,
                yearlyTotal * 0.7,
                yearlyTotal * 0.8,
                yearlyTotal * 0.9,
                yearlyTotal,
              ]
            : [0, 0, 0, 0, 0];
        default:
          return this.dashboardData.MonthlySales || Array(12).fill(0);
      }
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString(this.currencyFormat);
  }

  getStatusClass(status: string): string {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status.toLowerCase()) {
      case 'completed':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return baseClass;
    }
  }

  getStockStatus(inventory: number): string {
    if (inventory > 200) {
      return 'High Stock';
    } else if (inventory >= 100) {
      return 'Optimal';
    } else if (inventory >= 50) {
      return 'Low Stock';
    } else {
      return 'Critical';
    }
  }

  getStockStatusClass(inventory: number): string {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    if (inventory > 200) {
      return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    } else if (inventory >= 100) {
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    } else if (inventory >= 50) {
      return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    } else {
      return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
    }
  }

  navigateToReports() {
    this.router.navigate(['/report']);
  }

  navigateToTransaction() {
    this.router.navigate(['/inventoryhistory']);
  }

  navigateToProduct() {
    this.router.navigate(['/products']);
  }

  changeSelect() {
    this.initChartData();
  }
}
