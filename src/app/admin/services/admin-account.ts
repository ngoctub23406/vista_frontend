import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminPasswordChangeResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAccountService {
  private readonly apiUrl = `${environment.apiUrl}/admin/auth/change-password`;

  constructor(private http: HttpClient) {}

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<AdminPasswordChangeResponse> {
    const token = localStorage.getItem('vista_admin_token');
    if (!token) {
      return throwError(() => new Error('Vui lòng đăng nhập lại để tiếp tục.'));
    }

    return this.http.post<AdminPasswordChangeResponse>(
      this.apiUrl,
      data,
      {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      },
    );
  }
}
