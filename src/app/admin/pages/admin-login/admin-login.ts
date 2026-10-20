
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    User_id: string;
    Username: string;
    Email: string;
    Role: 'Customer' | 'Manager' | 'Staff';
    Full_name?: string;
  };
}

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
})
export class AdminLogin {
  showPassword = false;
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private readonly apiUrl = 'http://localhost:5000/api/auth/login';

  constructor(
    private http: HttpClient,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private destroyRef: DestroyRef,
  ) {}

  private showError(message: string): void {
    this.errorMessage = message;
    this.refreshView();
  }

  clearError(): void {
    this.errorMessage = '';
    this.refreshView();
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.isLoading) {
      return;
    }

    this.clearError();

    if (!this.email.trim() || !this.password) {
      this.showError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    this.isLoading = true;
    this.refreshView();

    this.http.post<LoginResponse>(this.apiUrl, {
      Email: this.email.trim(),
      Password: this.password,
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.refreshView();
      }),
    ).subscribe({
      next: (response) => {
        const user = response.user;

        if (!response.success || !response.token || !user) {
          this.showError(response.message || 'Đăng nhập thất bại.');
          return;
        }

        if (user.Role !== 'Manager' && user.Role !== 'Staff') {
          this.showError('Tài khoản không có quyền truy cập Admin.');
          return;
        }

        localStorage.setItem('vista_admin_token', response.token);
        localStorage.setItem('vista_admin_user', JSON.stringify(user));

        this.router.navigate(['/admin']);
      },
      error: (error: HttpErrorResponse) => {
        this.showError(
          error.status === 0
            ? 'Không thể kết nối máy chủ. Vui lòng thử lại.'
            : error.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.',
        );
      },
    });
  }

  private refreshView(): void {
    if (!this.destroyRef.destroyed) {
      this.changeDetectorRef.detectChanges();
    }
  }
}
