import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ProductDto, IProduct } from '../dto/Product.dto';

type EntityResponseType = HttpResponse<ProductDto>;
type EntityArrayResponseType = HttpResponse<ProductDto[]>;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  resourceUrl = environment.InventoryUrl;
  private fileUploadUrl = '#';
  //  private fileUploadUrl = 'https://jk-organizations-app1928.hdhd.io/Organizations/api/Upload/File';

  headers = {
    AuthToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
  };

  constructor(private http: HttpClient) {}

  createProduct(product: IProduct): Observable<HttpResponse<ProductDto>> {
    return this.http.post<ProductDto>(
      `${this.resourceUrl}/CreateProduct`,
      product,
      { observe: 'response', headers: this.headers }
    );
  }

  updateProduct(product: IProduct): Observable<HttpResponse<ProductDto>> {
    return this.http.put<ProductDto>(
      `${this.resourceUrl}/UpdateProduct`,
      product,
      { observe: 'response', headers: this.headers }
    );
  }

  deleteProduct(req?: any): Observable<HttpResponse<IProduct>> {
    return this.http.delete<ProductDto>(
      `${this.resourceUrl}/DeleteProduct`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findProduct(req?: any): Observable<HttpResponse<IProduct>> {
    return this.http.get<ProductDto>(
      `${this.resourceUrl}/FindProduct`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findAllProduct(params: any): Observable<HttpResponse<ProductDto[]>> {
    return this.http.get<ProductDto[]>(
      `${this.resourceUrl}/FindallProduct`,
      { params, observe: 'response', headers: this.headers }
    );
  }

findAllProductPaginated(params: any): Observable<HttpResponse<ProductDto[]>> {
  return this.http.get<ProductDto[]>(
    `${this.resourceUrl}/FindallProduct`,
    {
      params,
      observe: 'response',
      headers: this.headers,
    }
  );
}

  downloadFile(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.resourceUrl}/download/product`,
      { observe: 'response', responseType: 'blob' }
    );
  }

  // Method for uploading products from file
  uploadFile(formData: FormData): Observable<HttpResponse<any>> {
    return this.http.post(
      `${this.resourceUrl}/UploadProduct`,
      formData,
      { observe: 'response', headers: this.headers }
    );
  }

  // Method for uploading product image
  fileUpload(formData: FormData): Observable<HttpResponse<any>> {
    return this.http.post(`${this.fileUploadUrl}`, formData, {
      observe: 'response',
      reportProgress: true
    });
  }

  findAllIfProductByProductSubCategoryId(
    params: any
  ): Observable<HttpResponse<ProductDto[]>> {
    return this.http.get<ProductDto[]>(
      `${this.resourceUrl}/FindallifProductByProductSubCategoryId/ProductSubCategoryId`,
      { params, observe: 'response', headers: this.headers }
    );
  }

  findAllIfProductByProductSubCategoryIdPaginated(
    params: any
  ): Observable<HttpResponse<{ count: number; products: ProductDto[] }>> {
    return this.http.get<{ count: number; products: ProductDto[] }>(
      `${this.resourceUrl}/FindallifProductByProductSubCategoryId/ProductSubCategoryId/pg/search`,
      { params, observe: 'response', headers: this.headers }
    );
  }
}
