import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export interface Product {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  sku: string;
  description: string;
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

@Component({
  standalone: true,
  selector: 'app-stock-report',
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule, HttpClientModule],
  templateUrl: './html-report.component.html',
  providers: [DatePipe],
})
export class StockReportComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  isDownloading = false;
  reportType: string = '';
  title: string = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  singleDate: Date | null = null;
  generatedAt: Date = new Date();

  // Summary computed values
  get totalProducts(): number { return this.filteredProducts.length; }
  get totalQuantity(): number { return this.filteredProducts.reduce((s, p) => s + p.quantity, 0); }
  get totalValue(): number { return this.filteredProducts.reduce((s, p) => s + p.price * p.quantity, 0); }
  get perishableCount(): number { return this.filteredProducts.filter(p => p.isPerishable).length; }
  get lowStockProducts(): Product[] { return this.filteredProducts.filter(p => p.quantity < 100); }

  private readonly API_URL = 'https://api.smartstockflow.co.uk/DemandFlow-Service/api/FindallProduct';

  constructor(
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    const data = this.config.data;
    this.reportType = data.reportType;
    this.title = data.title;
    this.fromDate = data.fromDate ? new Date(data.fromDate) : null;
    this.toDate = data.toDate ? new Date(data.toDate) : null;
    this.singleDate = data.singleDate ? new Date(data.singleDate) : null;
    this.fetchProducts();
  }

  fetchProducts() {
    this.isLoading = true;
    this.http.get<Product[]>(this.API_URL).subscribe({
      next: (products) => {
        this.products = products.filter(p => !p.deleted);
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    switch (this.reportType) {
      case 'stock-report':
        // Filter by creation date range
        this.filteredProducts = this.products.filter(p => {
          const created = new Date(p.createdAt);
          const from = this.fromDate ? new Date(this.fromDate.setHours(0, 0, 0, 0)) : null;
          const to = this.toDate ? new Date(this.toDate.setHours(23, 59, 59, 999)) : null;
          if (from && created < from) return false;
          if (to && created > to) return false;
          return true;
        });
        break;

      case 'top-products-forecasting':
        // Top 5 by quantity
        this.filteredProducts = [...this.products]
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        break;

      case 'lowest-stock-products':
        // Filter by date range then sort ascending quantity
        const rangeFiltered = this.products.filter(p => {
          const created = new Date(p.createdAt);
          const from = this.fromDate ? new Date(this.fromDate.setHours(0, 0, 0, 0)) : null;
          const to = this.toDate ? new Date(this.toDate.setHours(23, 59, 59, 999)) : null;
          if (from && created < from) return false;
          if (to && created > to) return false;
          return true;
        });
        this.filteredProducts = [...rangeFiltered].sort((a, b) => a.quantity - b.quantity);
        break;

      default:
        this.filteredProducts = this.products;
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return this.datePipe.transform(date, 'MMMM d, yyyy') || 'N/A';
  }

  formatCurrency(val: number): string {
    return `$${val.toFixed(2)}`;
  }

  getStockStatus(qty: number): { label: string; class: string } {
    if (qty >= 200) return { label: 'High', class: 'status-high' };
    if (qty >= 100) return { label: 'Medium', class: 'status-medium' };
    return { label: 'Low', class: 'status-low' };
  }

  async downloadPDF() {
    this.isDownloading = true;
    try {
      // Dynamically import jsPDF and html2canvas (install via npm if needed)
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const reportEl = document.getElementById('stock-report-content');
      if (!reportEl) return;

      const canvas = await html2canvas(reportEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Multi-page
        let remainingHeight = pdfHeight;
        while (remainingHeight > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          remainingHeight -= pageHeight;
          position -= pageHeight;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      const filename = `${this.title.replace(/\s+/g, '_')}_${this.datePipe.transform(new Date(), 'yyyyMMdd')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Make sure jspdf and html2canvas are installed:\nnpm install jspdf html2canvas');
    } finally {
      this.isDownloading = false;
    }
  }

  close() {
    this.ref.close();
  }
}
