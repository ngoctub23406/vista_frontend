
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminPasswordResetService } from '../../services/admin-password-reset';

@Component({
  selector: 'app-admin-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-forgot-password.html',
  styleUrl: './admin-forgot-password.scss',
})
export class AdminForgotPassword {
  email = '';
  submitted = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private adminPasswordReset: AdminPasswordResetService,
  ) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage = '';

    const email = this.email.trim();

    if (!email) {
      this.errorMessage = 'Vui lòng nhập email.';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.errorMessage = 'Vui lòng nhập email hợp lệ.';
      return;
    }

    this.isLoading = true;
    this.adminPasswordReset.requestOtp({ Email: email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.submitted = true;
        this.router.navigate(['/admin/verify-otp'], {
          state: { email },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Không thể gửi mã lúc này. Vui lòng thử lại.';
      },
    });
  }
}
