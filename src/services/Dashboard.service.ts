import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DashboardDto, IDashboard } from '../dto/Dashboard.dto';

type EntityResponseType = HttpResponse<DashboardDto>;

@Injectable()
export class DashboardService {
  resourceUrl = environment.InventoryUrl;
  resourceUrli = environment.InventoryUrl;
modelURL = environment.forecasturl;
  headers = {
    AuthToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
  };

  constructor(private http: HttpClient) {}


    getModelStatus(): Observable<HttpResponse<any>> {
    return this.http.get<DashboardDto>(
      `${this.modelURL}/model/status`,
      { params: { }, observe: 'response', headers: this.headers }
    );
  }


  getDashboardData(branchId: string): Observable<HttpResponse<DashboardDto>> {
    return this.http.get<DashboardDto>(
      `${this.resourceUrl}/DashboardApi`,
      { params: { branchId }, observe: 'response', headers: this.headers }
    );
  }

    getCountProducts(): Observable<HttpResponse<any>> {
    return this.http.get<any>(
      `${this.resourceUrl}/CountProducts`,
      { params: { }, observe: 'response', headers: this.headers }
    );
  }


      getTotalInventoryStock(): Observable<HttpResponse<any>> {
    return this.http.get<any>(
      `${this.resourceUrl}/TotalInventoryStock`,
      { params: { }, observe: 'response', headers: this.headers }
    );
  }

        getTop5ProductsByStock(): Observable<HttpResponse<any>> {
    return this.http.get<any>(
      `${this.resourceUrl}/Top5ProductsByUnitSold`,
      { params: { }, observe: 'response', headers: this.headers }
    );
  }

  getTop5ForecastPredictions(body: {
  fromDate: string;
  toDate: string;
  weather: string;
  region: string;
  seasonality: string;
  holiday: boolean;
}): Observable<HttpResponse<any>> {
  return this.http.post<any>(
    `${this.resourceUrl}/Predict/Top5ProductsByUnitSold`,
    body,
    { observe: 'response' }
  );
}

  // findAllInventoryHistoryPaginated(
  //   params: any
  // ): Observable<HttpResponse<{ count: number; inventoryHistorys: InventoryHistoryDto[] }>> {
  //   return this.http.get<{ count: number; inventoryHistorys: InventoryHistoryDto[] }>(
  //     `${this.resourceUrli}/FindallInventoryHistory/pg/search`,
  //     { params, observe: 'response', headers: this.headers }
  //   );
  // }
}
