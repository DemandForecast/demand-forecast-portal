import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FloatLabel } from 'primeng/floatlabel';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { filter, finalize, map, Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButton } from 'primeng/selectbutton';
import { Checkbox } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';

import { ProductService } from '../../../services/Product.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ProductDto } from '../../../dto/Product.dto';


@Component({
  selector: 'app-create-update-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FloatLabel,
    ButtonModule,
    InputTextModule,
    DatePicker,
    PasswordModule,
    SelectButton,
    DropdownModule,
    Select,
    Checkbox,
    FormsModule,
    SkeletonModule,
    ToastModule,
    FileUploadModule,
    InputSwitchModule,
    InputGroupModule,
    InputGroupAddon
  ],
  templateUrl: './create-update-product.html',
  styleUrl: './create-update-product.scss',
  providers: [
    ConfirmationService,
    DialogService,
    ProductService,
  ]
})

export class CreateUpdateProduct implements OnInit, OnDestroy, AfterViewInit {
  product: ProductDto = {};
  private subscription: Subscription = new Subscription();
  submitted: boolean = false;
  productForm!: FormGroup;
  isLoadingClient: boolean = false;
  isLoading: boolean = false;
  uploadingImage: boolean = false;
  currencySymbol: string = '';

  categoryOptions: { label: string; value: string }[] = [
    { label: 'Drinks', value: 'Drinks' },
    { label: 'Confectionery', value: 'Confectionery' },
    { label: 'Snacks', value: 'Snacks' },
    { label: 'Bakery & Bread', value: 'Bakery & Bread' },
    { label: 'Dairy & Eggs', value: 'Dairy & Eggs' },
    { label: 'Grocery', value: 'Grocery' },
  ];

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fileUpload') fileUpload: any;
  isDataLoading: boolean = false;

  constructor(
    private productService: ProductService,
    private messageService: MessageService,
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    const currency = localStorage.getItem('selectedCurrency') || '';
    this.currencySymbol = this.getCurrencySymbol(currency);

    // Form Control with Validation
    this.productForm = this.fb.group({
      ProductId:       [''],
      ProductName:            ['', Validators.required],
      Description:     [''],
      Brand:           [''],
      Price:           [null, Validators.required],
      DiscountPercent: [null],
      Category:        [''],
      Quantity:        [null, Validators.required],
      IsActive:        [null],
      IsPerishable:    [false],
      sku:             [''],
      MOQ:             [null],
      StoreID:         [''],
      SupplierID:      [''],
      Image:           [''],
    });

    // Edit product if requested by the row click
    if (this.config.data != null) {
      this.editProduct(this.config.data);
    }
  }

  ngAfterViewInit(): void {
    // File input is now accessed via ViewChild
  }

  getCurrencySymbol(currencyCode: string): string {
    switch (currencyCode) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'Rs':
      case 'INR': return '₹';
      case 'LKR': return 'Rs.';
      default:    return '';
    }
  }

  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    } else {
      console.error('File input element not found');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not open file browser',
        life: 3000
      });
    }
  }

  onFileSelect(event: any): void {
    let files;

    if (event.files && event.files.length > 0) {
      files = event.files;
    } else if (event.target && event.target.files && event.target.files.length > 0) {
      files = event.target.files;
    }

    if (files && files.length > 0) {
      const file = files[0];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'File size exceeds 10MB limit',
          life: 3000
        });
        if (this.fileUpload) { this.fileUpload.clear(); }
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Only JPG, PNG, and GIF formats are allowed',
          life: 3000
        });
        if (this.fileUpload) { this.fileUpload.clear(); }
        return;
      }

      this.uploadImage(file);
    }
  }

  uploadImage(file: File): void {
    this.uploadingImage = true;

    const formData = new FormData();
    formData.append('file', file);

    this.subscription.add(
      this.productService.fileUpload(formData)
        .pipe(
          finalize(() => {
            this.uploadingImage = false;
            if (this.fileUpload) { this.fileUpload.clear(); }
          })
        )
        .subscribe(
          (response) => {
            if (response.body) {
              let imageUrl = '';

              if (response.body.url) {
                imageUrl = response.body.url;
              } else if (typeof response.body === 'string') {
                imageUrl = response.body;
              } else if (response.body.data && response.body.data.url) {
                imageUrl = response.body.data.url;
              } else if (response.body.path) {
                imageUrl = response.body.path;
              } else {
                const bodyContent = JSON.stringify(response.body);
                if (bodyContent.includes('http')) {
                  const matches = bodyContent.match(/(https?:\/\/[^"]+)/);
                  if (matches && matches.length > 0) {
                    imageUrl = matches[0];
                  }
                }
              }

              if (imageUrl) {
                this.product.Image = imageUrl;
                this.productForm.patchValue({ Image: imageUrl });
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Image uploaded successfully',
                  life: 3000
                });
              } else {
                console.error('Could not extract URL from response:', response.body);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Failed to extract image URL from response',
                  life: 3000
                });
              }
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to upload image - empty response',
                life: 3000
              });
            }
          },
          (error) => {
            console.error('Error uploading image:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to upload image',
              life: 3000
            });
          }
        )
    );
  }

  save() {
    this.submitted = true;

    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach((key) => {
        const control = this.productForm.get(key);
        if (control) {
          control.markAsTouched();
          control.markAsDirty();
        }
      });
      return;
    }

    this.isLoading = true;

    const product = this.productForm.value;

    if (product.ProductId) {
      this.subscription.add(
        this.productService.updateProduct(product).pipe(
          finalize(() => { this.isLoading = false; })
        ).subscribe(
          (res) => {
            if (res.body) {
              this.messageService.add({
                severity: 'success',
                summary: 'Successful',
                detail: `Product Updated Successfully.`,
                life: 3000
              });
            }
            this.CloseInstances();
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: `Failed To Update Product.`,
              life: 3000
            });
          }
        )
      );
    } else {
      this.subscription.add(
        this.productService.createProduct(product).pipe(
          finalize(() => { this.isLoading = false; })
        ).subscribe(
          (res) => {
            if (res.body) {
              this.messageService.add({
                severity: 'success',
                summary: 'Successful',
                detail: `Product Created Successfully.`,
                life: 3000
              });
            }
            this.CloseInstances();
          },
          (error) => {
            if (error.error.error === `[UPC SKU] unique`) {
              this.messageService.add({
                severity: 'error',
                summary: 'UPC or SKU',
                detail: `The provided UPC or SKU already exists in the system. Please enter a unique value.`,
                life: 3000
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: `Failed To Create Product.`,
                life: 3000
              });
            }
          }
        )
      );
    }
  }

  // Edit product — maps Go DTO field names to form control names
  editProduct(product: ProductDto) {
    this.product = { ...product };

    // Normalise IsActive from string to boolean if needed
    if ((product.IsActive as any) === 'true') {
      (product as any).IsActive = true;
    } else if ((product.IsActive as any) === 'false') {
      (product as any).IsActive = false;
    }

        // Form Control with Validation
  this.productForm.patchValue({
      ProductId:       product.ProductId       ?? '',
      ProductName:            (product as any).ProductName ?? (product as any).ProductName ?? '',
      Description:     product.Description     ?? '',
      Brand:           (product as any).Brand  ?? '',
      Price:           product.Price           ?? null,
      DiscountPercent: (product as any).DiscountPercent ?? null,
      Category:        product.Category        ?? '',
      Quantity:        product.Quantity        ?? null,
      IsActive:        product.IsActive        ?? null,
      IsPerishable:    (product as any).IsPerishable ?? false,
      sku:             product.sku             ?? '',
      MOQ:             product.MOQ             ?? null,
      StoreID:         (product as any).StoreID    ?? '',
      SupplierID:      (product as any).SupplierID ?? '',
      Image:           product.Image           ?? '',
    });
  }

  // Close dialog instances
  CloseInstances(event?: Event) {
    if (event) { event.preventDefault(); }
    this.ref.close(this.productForm.value);
    this.productForm.reset();
    this.submitted = false;
    this.product = {};
  }

  // Unsubscribe all services
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
