import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:5000/api/bookings';

export interface Booking {
  BookingId?: number;
  ClientName: string;
  MediaChannel: string;
  Campaign: string;
  BookingDate: string;
  Amount: number;
  Status: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  // Every request needs to prove who's asking - we attach the token
  // that was saved at login time to the Authorization header.
  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getAll(search?: string): Observable<Booking[]> {
    const url = search ? `${API_URL}?search=${encodeURIComponent(search)}` : API_URL;
    return this.http.get<Booking[]>(url, { headers: this.authHeaders() });
  }

  getById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${API_URL}/${id}`, { headers: this.authHeaders() });
  }

  create(booking: Booking): Observable<Booking> {
    return this.http.post<Booking>(API_URL, booking, { headers: this.authHeaders() });
  }

  update(id: number, booking: Booking): Observable<Booking> {
    return this.http.put<Booking>(`${API_URL}/${id}`, booking, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`, { headers: this.authHeaders() });
  }
}
