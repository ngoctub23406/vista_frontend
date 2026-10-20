import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminAccountService } from '../../services/admin-account';

@Component({
  selector: 'app-admin-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-change-password.html',
  styleUrl: './admin-change-password.scss',
})
export class AdminChangePassword {
  viewState: 'form' | 'loading' | 'success' = 'form';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  constructor(
    private readonly adminAccount: AdminAccountService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.viewState === 'loading' || this.viewState === 'success') {
      return;
    }

    this.errorMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu mới và xác nhận mật khẩu không khớp.';
      return;
    }

    this.viewState = 'loading';

    this.adminAccount
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .pipe(
        finalize(() => {
          if (this.viewState === 'loading') {
            this.viewState = 'form';
            this.changeDetectorRef.detectChanges();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (response.success !== true) {
            this.errorMessage =
              response.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
            return;
          }

          this.viewState = 'success';
          this.clearPasswords();
          this.changeDetectorRef.detectChanges();
        },
        error: (error: unknown) => {
          const message =
            typeof error === 'object' && error !== null &&
            'error' in error && typeof error.error === 'object' &&
            error.error !== null && 'message' in error.error &&
            typeof error.error.message === 'string'
              ? error.error.message
              : 'Không thể đổi mật khẩu. Vui lòng kiểm tra kết nối và thử lại.';
          this.errorMessage = message;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  private clearPasswords(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
