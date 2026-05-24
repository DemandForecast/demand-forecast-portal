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
import { HtmlReportComponent } from './html-report/html-report.component';
import { ReportService } from '../../services/Report.service';
import { roleConfig } from '../../app/access-control/roleConfig';

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
    ReportService,
    DialogService,
  ],
})
export class ReportComponent implements OnInit, OnDestroy {
  stockReportDates: DateRange = { fromDate: null, toDate: null };
  topProductsForecastingDate: Date | null = null;
  lowestStockProductsDates: DateRange = { fromDate: null, toDate: null };

  isLoading: boolean = false;
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

  showStockReportDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Stock Report',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'stock-report',
        title: 'Stock Report',
        fromDate: this.stockReportDates.fromDate,
        toDate: this.stockReportDates.toDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });
  }

  showTopProductsForecastingDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Top 5 Products Forecasting',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'top-products-forecasting',
        title: 'Top 5 Products Forecasting',
        singleDate: this.topProductsForecastingDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
    });
  }

  showLowestStockProductsDialog() {
    this.dialogRef = this.dialogService.open(HtmlReportComponent, {
      header: 'Lowest Stock Products Report',
      width: '80%',
      closable: true,
      modal: true,
      data: {
        reportType: 'lowest-stock-products',
        title: 'Lowest Stock Products Report',
        fromDate: this.lowestStockProductsDates.fromDate,
        toDate: this.lowestStockProductsDates.toDate,
      },
      appendTo: 'body',
      baseZIndex: 1000,
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
