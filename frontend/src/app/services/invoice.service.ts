import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:5000/api/invoices';

export interface Invoice {
  InvoiceId?: number;
  BookingId: number;
  InvoiceNumber: string;
  InvoiceDate: string;
  Amount: number;
  PaymentStatus: string;
  ClientName?: string;   // comes from the JOIN in the backend, for display only
  Campaign?: string;
}

export interface BookingOption {
  BookingId: number;
  ClientName: string;
  Campaign: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getAll(search?: string): Observable<Invoice[]> {
    const url = search ? `${API_URL}?search=${encodeURIComponent(search)}` : API_URL;
    return this.http.get<Invoice[]>(url, { headers: this.authHeaders() });
  }

  getBookingOptions(): Observable<BookingOption[]> {
    return this.http.get<BookingOption[]>(`${API_URL}/bookings-list`, { headers: this.authHeaders() });
  }

  create(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(API_URL, invoice, { headers: this.authHeaders() });
  }

  update(id: number, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${API_URL}/${id}`, invoice, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`, { headers: this.authHeaders() });
  }
}
