import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { roleConfig } from '../../app/access-control/roleConfig';
import { StockReportComponent } from './html-report/html-report.component';

interface DateRange {
  fromDate: Date | null;
  toDate: Date | null;
}

@Component({
  standalone: true,
  selector: 'app-Report',
  imports: [
    CommonModule,
    ToastModule,
    ButtonModule,
    ConfirmDialog,
    CalendarModule,
    FormsModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './Report.component.html',
  host: {
    class:
      'h-full flex-1 flex flex-col overflow-hidden border border-surface rounded-2xl p-6',
  },
  styleUrl: '././Report.component.scss',
  providers: [
    ConfirmationService,
    MessageService,
    DialogService,
  ],
})
export class ReportComponent implements OnInit, OnDestroy {
  stockReportDates: DateRange = { fromDate: null, toDate: null };
  topProductsForecastingDate: Date | null = null;
  lowestStockProductsDates: DateRange = { fromDate: null, toDate: null };

  roleConfig = roleConfig;
  private dialogRef: DynamicDialogRef | null = null;

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.stockReportDates = { fromDate: firstDay, toDate: lastDay };
    this.topProductsForecastingDate = today;
    this.lowestStockProductsDates = { fromDate: firstDay, toDate: lastDay };
  }

  private openReportDialog(
    header: string,
    reportType: string,
    data: Record<string, unknown>
  ) {
    // Close any existing dialog first
    if (this.dialogRef) {
      this.dialogRef.close();
    }

    this.dialogRef = this.dialogService.open(StockReportComponent, {
      header,
      width: '90%',
      style: { 'max-width': '1100px' },
      closable: true,
      modal: true,
      data: {
        reportType,
        title: header,
        ...data,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });
  }

  showStockReportDialog() {
    this.openReportDialog('Stock Report', 'stock-report', {
      fromDate: this.stockReportDates.fromDate,
      toDate: this.stockReportDates.toDate,
    });
  }

  showTopProductsForecastingDialog() {
    this.openReportDialog('Top 5 Products Forecasting', 'top-products-forecasting', {
      singleDate: this.topProductsForecastingDate,
    });
  }

  showLowestStockProductsDialog() {
    this.openReportDialog('Lowest Stock Products Report', 'lowest-stock-products', {
      fromDate: this.lowestStockProductsDates.fromDate,
      toDate: this.lowestStockProductsDates.toDate,
    });
  }

  hasAccess(dtoId: string, accessType: string): boolean {
    const roleName = localStorage.getItem('roleName');
    if (roleName !== null) {
      const rolePermissions = roleConfig[roleName];
      if (rolePermissions && rolePermissions[dtoId]) {
        return rolePermissions[dtoId]?.includes(accessType) || false;
      }
    }
    return false;
  }

  ngOnDestroy() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
