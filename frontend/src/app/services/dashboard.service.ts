import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Booking } from './booking.service';

const API_URL = 'http://localhost:5000/api/dashboard';

export interface DashboardSummary {
  totalBookings: number;
  totalInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  recentBookings: Booking[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getSummary(): Observable<DashboardSummary> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
    return this.http.get<DashboardSummary>(`${API_URL}/summary`, { headers });
  }
}
