
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class AdminLogin implements OnDestroy {
  showPassword = false;
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private readonly apiUrl = 'http://localhost:5000/api/auth/login';
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private showError(message: string): void {
    this.clearError();
    this.errorMessage = message;

    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(() => {
      if (this.errorTimer !== timer) return;

      this.errorMessage = '';
      this.errorTimer = null;
    }, 3000);

    this.errorTimer = timer;
  }

  clearError(): void {
    if (this.errorTimer !== null) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }

    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.clearError();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.clearError();

    if (!this.email.trim() || !this.password) {
      this.showError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    this.isLoading = true;

    this.http.post<LoginResponse>(this.apiUrl, {
      Email: this.email.trim(),
      Password: this.password,
    }).subscribe({
      next: (response) => {
        const user = response.user;

        if (!response.success || !response.token || !user) {
          this.showError(response.message || 'Đăng nhập thất bại.');
          this.isLoading = false;
          return;
        }

        if (user.Role !== 'Manager' && user.Role !== 'Staff') {
          this.showError('Tài khoản không có quyền truy cập Admin.');
          this.isLoading = false;
          return;
        }

        localStorage.setItem('vista_admin_token', response.token);
        localStorage.setItem('vista_admin_user', JSON.stringify(user));

        this.router.navigate(['/admin']);
      },
      error: (error: HttpErrorResponse) => {
        this.showError(error.error?.message || 'Không thể kết nối máy chủ.');
        this.isLoading = false;
      },
    });
  }
}
