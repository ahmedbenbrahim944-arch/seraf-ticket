import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StatisticsFilter {
  startDate?: string;
  endDate?: string;
  ligne?: string;
  reference?: string;
  typeTicket?: string;
}

export interface StatisticsResponse {
  success: boolean;
  data: {
    globales: {
      totalTicketsImprimes: number;
      totalJobs: number;
      totalReferencesUtilisees: number;
      moyenneTicketsParJob: number;
      periodeCouverture?: {
        dateDebut: string;
        dateFin: string;
      };
    };
    parReference: Array<{
      ligne: string;
      reference: string;
      typeTicket: string;
      totalImprime: number;
      pourcentage: number;
      lastPrintDate?: string;
      nombreJobs: number;
    }>;
    parTypeTicket: Array<{
      typeTicket: string;
      totalImprime: number;
      pourcentage: number;
      nombreReferences: number;
      references: Array<{
        ligne: string;
        reference: string;
        totalImprime: number;
      }>;
    }>;
    topReferences: Array<any>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = 'http://localhost:3000/statistics';

  constructor(private http: HttpClient) {}

  getGlobalStatistics(filters: StatisticsFilter = {}): Observable<StatisticsResponse> {
    let params = new HttpParams();
    
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.ligne) {
      params = params.set('ligne', filters.ligne);
    }
    if (filters.reference) {
      params = params.set('reference', filters.reference);
    }
    if (filters.typeTicket) {
      params = params.set('typeTicket', filters.typeTicket);
    }

    return this.http.get<StatisticsResponse>(`${this.apiUrl}/global`, { params });
  }

  getStatisticsByPeriod(period: string, filters: StatisticsFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<any>(`${this.apiUrl}/period/${period}`, { params });
  }

  getTypeTicketStatistics(filters: StatisticsFilter = {}): Observable<any> {
    let params = new HttpParams();
    
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<any>(`${this.apiUrl}/types`, { params });
  }
}