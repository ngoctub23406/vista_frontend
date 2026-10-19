import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminPasswordResetService } from '../../services/admin-password-reset';

@Component({
  selector: 'app-admin-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-reset-password.html',
  styleUrl: './admin-reset-password.scss',
})
export class AdminResetPassword {
  email = '';
  otpCode = '';

  newPassword = '';
  confirmPassword = '';

  showNewPassword = false;
  showConfirmPassword = false;

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private router: Router, private adminPasswordReset: AdminPasswordResetService) {
    this.email =
      this.router.getCurrentNavigation()?.extras.state?.['email']
      ?? history.state?.email
      ?? '';

    this.otpCode =
      this.router.getCurrentNavigation()?.extras.state?.['otpCode']
      ?? history.state?.otpCode
      ?? '';
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 8 ký tự.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    if (!this.email || !/^\d{6}$/.test(this.otpCode)) {
      this.errorMessage = 'Yêu cầu không hợp lệ. Vui lòng xác minh lại mã OTP.';
      return;
    }

    this.isLoading = true;
    this.adminPasswordReset
      .resetPassword({
        Email: this.email,
        otpCode: this.otpCode,
        Password: this.newPassword,
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message;
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
        },
      });
  }
}