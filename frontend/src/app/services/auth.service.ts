import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API_URL = 'http://localhost:5000/api/auth';

export interface LoginResponse {
  message: string;
  token: string;
  user: { id: number; username: string; fullName: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  // Calls the backend login endpoint. On success, we save the token
  // and user info in the browser's localStorage so the app "remembers"
  // the login even after a page refresh.
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem('medialedger_token', res.token);
        localStorage.setItem('medialedger_user', JSON.stringify(res.user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('medialedger_token');
    localStorage.removeItem('medialedger_user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('medialedger_token');
  }

  getToken(): string | null {
    return localStorage.getItem('medialedger_token');
  }

  getUser(): { id: number; username: string; fullName: string } | null {
    const raw = localStorage.getItem('medialedger_user');
    return raw ? JSON.parse(raw) : null;
  }
}
