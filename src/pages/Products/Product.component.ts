import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Tag } from 'primeng/tag';
import { PopoverModule } from 'primeng/popover';
import { Tooltip, TooltipModule } from 'primeng/tooltip';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { getDtoNameById } from '../../app/relationships/reationshipConfig';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';

import { IProduct, ProductDto } from '../../dto/Product.dto';
import { ProductService } from '../../services/Product.service';
import { CreateUpdateProduct } from './create-update-product/create-update-product';
import { roleConfig } from '../../app/access-control/roleConfig';

interface ForecastData {
  date: Date;
  demand: number;
  revenue: number;
  confidence: number;
}

@Component({
  standalone: true,
  selector: 'app-Product',
  imports: [
    CommonModule,
    ToastModule,
    IconField,
    InputIcon,
    ButtonModule,
    TableModule,
    TooltipModule,
    PopoverModule,
    OverlayBadgeModule,
    AvatarModule,
    DividerModule,
    InputTextModule,
    ConfirmDialog,
    Tooltip,
    DialogModule,
    CalendarModule,
    FormsModule,
    ChartModule,
  ],
  templateUrl: './Product.component.html',
  host: {
    class:
      'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6',
  },
  styleUrl: '././Product.component.scss',
  providers: [
    ConfirmationService,
    MessageService,
    DialogService,
    ProductService,
  ],
})
export class ProductComponent implements OnInit {
  first = 0;
  rows = 10;
  page = 1;
  totalRecords = 0;
  selectedRows: any = [];
  @ViewChild('dt') dt!: Table;
  @ViewChild('fileUpload') fileUpload!: ElementRef<HTMLInputElement>;
  ProductData: ProductDto[] = [];
  isDataLoading: boolean = false;
  canUpdate: boolean = true;
  canDelete: boolean = true;
  roleConfig = roleConfig;

  searchQuery = '';
  searchSubject = new Subject<string>();

  dtoName: string | undefined = '';
  ProductSubCategory: string = '';
  currencySymbol: string = '';
  loading: boolean = false;
  private subscription: Subscription = new Subscription();

  // Forecast Dialog Properties
  showForecastDialog: boolean = false;
  selectedProduct: ProductDto | null = null;
  forecastStartDate: Date | null = null;
  forecastEndDate: Date | null = null;
  minDate: Date = new Date();
  loadingForecast: boolean = false;
  forecastData: ForecastData[] = [];
  chartData: any = {};
  chartOptions: any = {};

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private dialogService: DialogService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit() {
    const currency = localStorage.getItem('selectedCurrency') || 'LKR';
    this.currencySymbol = this.getCurrencySymbol(currency);
    this.subscription.add(
      this.searchSubject
        .pipe(debounceTime(400), distinctUntilChanged())
        .subscribe((searchTerm) => {
          this.searchQuery = searchTerm;
          this.first = 0;
          this.page = 1;
          this.loadProducts();
        })
    );

    this.subscription.add(
      this.route.queryParams.subscribe((params: any) => {
        this.processQueryParams(params);
      })
    );
  }

  private processQueryParams(params: any) {
    this.isDataLoading = true;
    this.dtoName = getDtoNameById(params['id']);

    switch (this.dtoName) {
      case 'ProductSubCategory':
        this.ProductSubCategory = params['primarykey'];
        this.findAllProductByProductSubCategoryIdPaginated({});
        break;

      default:
        this.loadProducts();
        break;
    }
  }

  findAllProductByProductSubCategoryIdPaginated(params: any) {
    if (this.ProductSubCategory) {
      const requestParams = {
        page: this.page.toString(),
        size: this.rows.toString(),
        searchkeyword: this.searchQuery,
        productSubCategoryId: this.ProductSubCategory,
      };

      this.subscription.add(
        this.productService
          .findAllIfProductByProductSubCategoryIdPaginated(requestParams)
          .pipe(
            filter((res) => res.ok),
            map((res) => res.body)
          )
          .subscribe(
            (response) => {
              if (response) {
                this.ProductData = this.mapBackendDataToDto(response.products);
                this.totalRecords = response.count;
              } else {
                this.ProductData = [];
                this.totalRecords = 0;
              }
              this.isDataLoading = false;
            },
            (error: HttpErrorResponse) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: `Failed to load products.`,
                life: 6000,
              });
              this.isDataLoading = false;
              console.error('Error loading products:', error);
            }
          )
      );
    }
  }

  loadProducts() {
    this.isDataLoading = true;
    if (this.dtoName === 'ProductSubCategory') {
      this.findAllProductByProductSubCategoryIdPaginated({});
      return;
    }

    const params = {
      page: this.page.toString(),
      size: this.rows.toString(),
      searchkeyword: this.searchQuery,
    };

    this.subscription.add(
      this.productService
        .findAllProductPaginated(params)
        .pipe(
          filter((res) => res.ok),
          map((res) => res.body)
        )
        .subscribe(
          (response) => {
            if (response) {
              // Map the backend data format to our DTO format
              this.ProductData = this.mapBackendDataToDto(response);
              this.totalRecords = response.length;
            } else {
              this.ProductData = [];
              this.totalRecords = 0;
            }
            this.isDataLoading = false;
          },
          (error: HttpErrorResponse) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: `Failed to load products.`,
              life: 6000,
            });
            this.isDataLoading = false;
            console.error('Error loading products:', error);
          }
        )
    );
  }

  /**
   * Map backend data format (camelCase) to DTO format (PascalCase)
   */
  private mapBackendDataToDto(data: any[]): ProductDto[] {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((item) => new ProductDto(
      item.productId || item.ProductId,
      item.productName || item.ProductName,
      item.category || item.Category,
      item.brand || item.Brand,
      item.sku || item.SKU || item.sku,
      item.description || item.Description,
      item.price || item.Price || 0,
      item.image || item.Image,
      item.discountPercent || item.DiscountPercent || 0,
      item.isPerishable || item.IsPerishable || false,
      item.storeId || item.StoreID,
      item.supplierId || item.SupplierID,
      item.quantity || item.Quantity || 0,
      item.moq || item.MOQ,
      item.isActive !== undefined ? item.isActive : (item.IsActive !== undefined ? item.IsActive : true),
      item.deleted || item.Deleted || false
    ));
  }

  onGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery = filterValue;

    if (this.dtoName === 'ProductSubCategory') {
      this.page = 1;
      this.first = 0;
      this.findAllProductByProductSubCategoryIdPaginated({});
    } else {
      this.searchSubject.next(filterValue);
    }
  }

  next() {
    this.page++;
    this.first = (this.page - 1) * this.rows;
    if (this.dtoName === 'ProductSubCategory') {
      this.findAllProductByProductSubCategoryIdPaginated({});
    } else {
      this.loadProducts();
    }
  }

  prev() {
    this.page--;
    this.first = (this.page - 1) * this.rows;
    if (this.dtoName === 'ProductSubCategory') {
      this.findAllProductByProductSubCategoryIdPaginated({});
    } else {
      this.loadProducts();
    }
  }

  pageChange(event: { first: number; rows: number }) {
    this.first = event.first;
    this.rows = event.rows;
    this.page = Math.floor(this.first / this.rows) + 1;
    this.loadProducts();
  }

  isLastPage(): boolean {
    return this.totalRecords
      ? this.first + this.rows >= this.totalRecords
      : true;
  }

  isFirstPage(): boolean {
    return this.page === 1;
  }

  get currentPage(): number {
    return this.page;
  }

  get totalPages(): number {
    return this.totalRecords ? Math.ceil(this.totalRecords / this.rows) : 0;
  }

  getCurrencySymbol(currencyCode: string): string {
    switch (currencyCode) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'JPY':
        return '¥';
      case 'INR':
        return '₹';
      case 'LKR':
        return 'Rs.';
      case 'Rs':
        return 'Rs.';
      default:
        return currencyCode;
    }
  }

  getIsActiveColor(isActive: any): string {
    if (isActive === true || isActive === 'true' || isActive === 'True') {
      return 'var(--green-500)';
    }
    return 'var(--red-500)';
  }

  getActiveStatus(isActive: any): string {
    if (isActive === true || isActive === 'true' || isActive === 'True') {
      return 'Active';
    }
    return 'Inactive';
  }

  /**
   * Get stock level status based on quantity
   */
  getStockLevel(quantity: number | undefined): 'high' | 'medium' | 'low' {
    const qty = quantity || 0;
    if (qty > 100) return 'high';
    if (qty > 50) return 'medium';
    return 'low';
  }

  /**
   * Calculate discounted price
   */
  getDiscountedPrice(product: ProductDto): number {
    const price = product.Price || 0;
    const discount = product.DiscountPercent || 0;

    if (discount > 0) {
      return Math.round((price * (1 - discount / 100)) * 100) / 100;
    }
    return price;
  }

  /**
   * Calculate savings from discount
   */
  getSavings(product: ProductDto): number {
    const price = product.Price || 0;
    const discountedPrice = this.getDiscountedPrice(product);
    return Math.round((price - discountedPrice) * 100) / 100;
  }

  downloadFile() {
    this.productService.downloadFile().subscribe(
      (response: HttpResponse<Blob>) => {
        const contentDispositionHeader: string | null =
          response.headers.get('content-disposition');
        const filename: string =
          this.getFilenameFromContentDisposition(contentDispositionHeader);

        if (response.body) {
          const blobUrl: string = window.URL.createObjectURL(response.body);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.href = blobUrl;
          a.download = filename;
          a.click();

          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Download Successful',
          detail: `Excel successfully downloaded.`,
          life: 3000,
        });
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Download Failed',
          detail: `Failed to download excel.`,
          life: 3000,
        });
      }
    );
  }

  private getFilenameFromContentDisposition(header: string | null): string {
    const today = new Date();
    const date = today.toISOString().slice(0, 10);

    if (!header) {
      return 'Products_' + date + '.csv';
    }
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(header);
    if (!matches || !matches[1]) {
      return 'Products_' + date + '.csv';
    }
    return matches[1].replace(/['"]/g, '');
  }

  triggerFileDialog(): void {
    this.fileUpload.nativeElement.click();
  }

  uploadFile(event: any) {
    const file: File = event.target.files[0];

    const formData: FormData = new FormData();
    formData.append('file', file);

    this.loading = true;

    this.productService.uploadFile(formData).subscribe(
      (response) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Upload Successful',
          detail: `Successfully uploaded ${file.name}`,
          life: 3000,
        });

        this.loadProducts();
      },
      (error) => {
        this.loading = false;

        let errorMessage = `Failed to upload file "${file.name}".`;

        if (error.error) {
          if (error.error.message) {
            errorMessage = error.error.message;
          }

          if (error.error.errors && Array.isArray(error.error.errors)) {
            const topErrors = error.error.errors.slice(0, 3);
            errorMessage += ` First errors: ${topErrors.join('; ')}`;

            if (error.error.errors.length > 3) {
              this.showErrorDetails(error.error.errors, file.name);
            }
          }
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: errorMessage,
          life: 5000,
        });

        event.target.value = '';
      }
    );
  }

  showErrorDetails(errors: string[], fileName: string) {
    this.confirmationService.confirm({
      header: `Upload Errors for ${fileName}`,
      message: `<div class="error-list">
        <p>The following errors were found:</p>
        <ul>${errors.map((error) => `<li>${error}</li>`).join('')}</ul>
        <p>Please correct these issues and try again.</p>
      </div>`,
      acceptLabel: 'Close',
      rejectVisible: false,
      accept: () => {},
    });
  }

  findAllProductByProductSubCategoryId(params: any) {
    if (this.ProductSubCategory) {
      this.subscription.add(
        this.productService
          .findAllIfProductByProductSubCategoryId({
            ProductSubCategoryId: this.ProductSubCategory,
          })
          .pipe(
            filter((res: HttpResponse<IProduct[]>) => res.ok),
            map((res: HttpResponse<IProduct[]>) => res.body)
          )
          .subscribe(
            (res: IProduct[] | null) => {
              if (res != null) {
                this.ProductData = this.mapBackendDataToDto(res);
              } else {
                this.ProductData = [];
              }
              this.isDataLoading = false;
            },

            (res: HttpErrorResponse) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: `Failed To Load all Product.`,
                life: 6000,
              });
              this.isDataLoading = false;
              console.log('error in extracting all Product', res);
            }
          )
      );
    }
  }

  reloadState() {
    this.page = 1;
    this.first = 0;
    const params = this.route.snapshot.queryParams;

    if (this.dtoName === 'ProductSubCategory') {
      this.findAllProductByProductSubCategoryIdPaginated({});
    } else {
      this.loadProducts();
    }
  }

  showCreateProductDialog() {
    switch (this.dtoName) {
      case 'ProductSubCategory':
        this.showCreateProductByProductSubCategoryDialog();
        break;

      default:
        this.showCreateProductDialogDefault();
        break;
    }
  }

  showCreateProductByProductSubCategoryDialog() {
    const ref = this.dialogService.open(CreateUpdateProduct, {
      data: { ProductSubCategoryId: this.ProductSubCategory },
      header: 'Create Product',
      width: '60%',
      closable: true,
      modal: true,
    });
    ref.onClose.subscribe(() => {
      this.findAllProductByProductSubCategoryId({});
    });
  }

  showCreateProductDialogDefault() {
    const ref = this.dialogService.open(CreateUpdateProduct, {
      header: 'Create Product',
      width: '60%',
      closable: true,
      modal: true,
    });
    ref.onClose.subscribe(() => {
      this.loadProducts();
    });
  }

  showEditProductDialog(Product: ProductDto) {
    const ref = this.dialogService.open(CreateUpdateProduct, {
      data: Product,
      header: 'Update Product',
      width: '60%',
      closable: true,
      modal: true,
    });
    ref.onClose.subscribe(() => {
      const params = this.route.snapshot.queryParams;
      this.processQueryParams(params);
    });
  }

  deleteProduct(Product: ProductDto) {
    this.confirmationService.confirm({
      header: 'Are you sure ?',
      message: 'Please confirm to proceed.',
      accept: () => {
        this.ConfirmDeleteProduct(Product);
        this.messageService.add({
          severity: 'error',
          summary: 'Deleted',
          detail: 'You have deleted ',
        });
      },
    });
  }

  ConfirmDeleteProduct(Product: ProductDto) {
    this.ProductData = this.ProductData.filter(
      (val) => val.ProductId !== Product.ProductId
    );
    this.subscription.add(
      this.productService
        .deleteProduct({ productId: Product.ProductId })
        .subscribe(() => {
          this.loadProducts();
        })
    );
  }

  hasAccess(dtoId: string, accessType: string): boolean {
    const roleName = localStorage.getItem('roleName');

    if (roleName !== null) {
      const rolePermissions = roleConfig[roleName];

      if (rolePermissions && rolePermissions[dtoId]) {
        if (rolePermissions[dtoId]?.includes(accessType)) {
          return true;
        } else {
          if (accessType === 'DELETE') {
            this.canDelete = false;
          }

          if (accessType === 'UPDATE') {
            this.canUpdate = false;
          }
        }
      }
    }

    return false;
  }

  // ==================== DEMAND FORECAST METHODS ====================

  /**
   * Open the forecast dialog when a product card is clicked
   */
  openForecastDialog(product: ProductDto): void {
    this.selectedProduct = product;
    this.showForecastDialog = true;
    this.forecastData = [];
    this.forecastStartDate = null;
    this.forecastEndDate = null;
  }

  /**
   * Close the forecast dialog
   */
  closeForecastDialog(): void {
    this.showForecastDialog = false;
    this.selectedProduct = null;
    this.forecastData = [];
    this.forecastStartDate = null;
    this.forecastEndDate = null;
  }

  /**
   * Get the number of days between start and end date
   */
  getDaysDifference(): number {
    if (!this.forecastStartDate || !this.forecastEndDate) {
      return 0;
    }
    const diffTime = Math.abs(
      this.forecastEndDate.getTime() - this.forecastStartDate.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  /**
   * Generate demand forecast
   */
  generateForecast(): void {
    if (!this.forecastStartDate || !this.forecastEndDate || !this.selectedProduct) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Information',
        detail: 'Please select both start and end dates.',
        life: 3000,
      });
      return;
    }

    this.loadingForecast = true;

    const params = {
      productId: this.selectedProduct.ProductId,
      startDate: this.formatDate(this.forecastStartDate),
      endDate: this.formatDate(this.forecastEndDate),
    };

    // TODO: Replace with actual API call
    // this.productService.getDemandForecast(params).subscribe(...)
    this.simulateForecastAPI(params);
  }

  /**
   * Simulated API call - Replace with actual service
   */
  private simulateForecastAPI(params: any): void {
    setTimeout(() => {
      const mockData = this.generateMockForecastData(
        new Date(params.startDate),
        new Date(params.endDate)
      );
      this.processForecastResponse(mockData);
      this.loadingForecast = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Forecast Generated',
        detail: 'Demand forecast has been successfully generated.',
        life: 3000,
      });
    }, 1500);
  }

  /**
   * Generate mock forecast data
   */
  private generateMockForecastData(startDate: Date, endDate: Date): any[] {
    const data: any[] = [];
    const currentDate = new Date(startDate);
    const basePrice = this.getDiscountedPrice(this.selectedProduct!);

    while (currentDate <= endDate) {
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const baseDemand = isWeekend ? 80 : 50;
      const randomVariation = Math.floor(Math.random() * 30);
      const demand = baseDemand + randomVariation;

      const revenue = demand * basePrice;
      const confidence = 70 + Math.floor(Math.random() * 25);

      data.push({
        date: new Date(currentDate),
        demand: demand,
        revenue: Math.round(revenue),
        confidence: confidence,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }

  /**
   * Process the forecast response
   */
  private processForecastResponse(response: any[]): void {
    this.forecastData = response.map((item) => ({
      date: new Date(item.date),
      demand: item.demand,
      revenue: item.revenue,
      confidence: item.confidence,
    }));

    this.updateChartData();
  }

  /**
   * Handle forecast errors
   */
  private handleForecastError(error: HttpErrorResponse): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Forecast Failed',
      detail: 'Failed to generate demand forecast. Please try again.',
      life: 5000,
    });
    console.error('Forecast error:', error);
  }

  /**
   * Update chart data
   */
  private updateChartData(): void {
    const labels = this.forecastData.map((item) =>
      this.formatDateForChart(item.date)
    );
    const demandData = this.forecastData.map((item) => item.demand);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Forecasted Demand',
          data: demandData,
          fill: true,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#4F46E5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }

  /**
   * Initialize chart options
   */
  private initializeChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: 'bold',
            },
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 13,
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (context: any) => {
              return ` Demand: ${context.parsed.y} units`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            font: {
              size: 11,
            },
            callback: function (value: any) {
              return value + ' units';
            },
          },
        },
      },
    };
  }

  getTotalForecast(): number {
    return this.forecastData.reduce((sum, item) => sum + item.demand, 0);
  }

  getAverageForecast(): string {
    if (this.forecastData.length === 0) return '0';
    const avg = this.getTotalForecast() / this.forecastData.length;
    return avg.toFixed(1);
  }

  getPeakForecast(): number {
    if (this.forecastData.length === 0) return 0;
    return Math.max(...this.forecastData.map((item) => item.demand));
  }

  getEstimatedRevenue(): string {
    const total = this.forecastData.reduce((sum, item) => sum + item.revenue, 0);
    return this.formatNumber(total);
  }

  /**
   * Export forecast data to CSV
   */
  exportForecastData(): void {
    if (!this.forecastData || this.forecastData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No forecast data available to export.',
        life: 3000,
      });
      return;
    }

    const headers = ['Date', 'Forecasted Demand', 'Expected Revenue', 'Confidence'];
    const csvData = this.forecastData.map((item) => [
      this.formatDate(item.date),
      item.demand.toString(),
      item.revenue.toString(),
      item.confidence.toString() + '%',
    ]);

    const csvContent = [
      ['Product:', this.selectedProduct?.ProductName || ''],
      ['Period:', `${this.formatDate(this.forecastStartDate!)} to ${this.formatDate(this.forecastEndDate!)}`],
      ['Generated:', new Date().toLocaleString()],
      [],
      headers,
      ...csvData,
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `forecast_${this.selectedProduct?.ProductId}_${Date.now()}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.messageService.add({
      severity: 'success',
      summary: 'Export Successful',
      detail: 'Forecast data has been exported successfully.',
      life: 3000,
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateForChart(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }

  private formatNumber(num: number): string {
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
