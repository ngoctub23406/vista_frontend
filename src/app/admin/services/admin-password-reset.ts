import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminPasswordResetResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPasswordResetService {
  private readonly apiUrl = `${environment.apiUrl}/admin/auth`;

  constructor(private http: HttpClient) {}

  requestOtp(data: { Email: string }): Observable<AdminPasswordResetResponse> {
    return this.http.post<AdminPasswordResetResponse>(
      `${this.apiUrl}/forgot-password`,
      data,
    );
  }

  verifyOtp(data: {
    Email: string;
    otpCode: string;
  }): Observable<AdminPasswordResetResponse> {
    return this.http.post<AdminPasswordResetResponse>(
      `${this.apiUrl}/verify-otp`,
      data,
    );
  }

  resetPassword(data: {
    Email: string;
    otpCode: string;
    Password: string;
  }): Observable<AdminPasswordResetResponse> {
    return this.http.post<AdminPasswordResetResponse>(
      `${this.apiUrl}/reset-password`,
      data,
    );
  }
}