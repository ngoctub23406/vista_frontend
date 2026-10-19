
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminPasswordResetService } from '../../services/admin-password-reset';

@Component({
  selector: 'app-admin-verify-otp',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-verify-otp.html',
  styleUrl: './admin-verify-otp.scss',
})
export class AdminVerifyOtp {
  email = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  errorMessage = '';
  isLoading = false;

  @ViewChildren('otpInput')
  otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private router: Router,
    private adminPasswordReset: AdminPasswordResetService,
  ) {
    const navigation = this.router.getCurrentNavigation();

    this.email =
      navigation?.extras.state?.['email'] ??
      history.state?.email ??
      '';
  }

  get otpCode(): string {
    return this.otpDigits.join('');
  }

  trackByIndex(index: number): number {
    return index;
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    this.errorMessage = '';
    this.updateOtpDigits(index, input.value);
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.errorMessage = '';

      if (this.otpDigits[index]) {
        this.otpDigits[index] = '';
      } else if (index > 0) {
        this.otpDigits[index - 1] = '';
        this.focusInput(index - 1);
      }

      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusInput(index + 1);
      return;
    }

    // Cho phép phím chức năng và tổ hợp Ctrl/Cmd.
    if (
      event.ctrlKey ||
      event.metaKey ||
      [
        'Tab',
        'Delete',
        'Home',
        'End',
        'Enter',
      ].includes(event.key)
    ) {
      if (event.key === 'Delete') {
        this.otpDigits[index] = '';
        this.errorMessage = '';
      }
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      this.errorMessage = '';
      this.updateOtpDigits(index, event.key);
      return;
    }

    // Chỉ chấp nhận phím số.
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onOtpPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();

    const pasted = event.clipboardData
      ?.getData('text')
      .replace(/\D/g, '')
      .slice(0, 6 - index);

    if (!pasted) return;

    this.errorMessage = '';
    this.updateOtpDigits(index, pasted);
  }

  private updateOtpDigits(startIndex: number, value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 6 - startIndex);

    if (!digits) {
      this.otpDigits[startIndex] = '';
      return;
    }

    if (digits.length === 1) {
      this.otpDigits[startIndex] = digits;

      if (startIndex < 5) {
        this.focusInput(startIndex + 1);
      }

      return;
    }

    for (let index = startIndex; index < 6; index++) {
      this.otpDigits[index] = digits[index - startIndex] ?? '';
    }

    this.focusInput(Math.min(startIndex + digits.length, 5));
  }

  private focusInput(index: number): void {
    this.otpInputs?.get(index)?.nativeElement.focus();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage =
        'Chưa có email. Vui lòng quay lại nhập email trước.';
      return;
    }

    if (!/^\d{6}$/.test(this.otpCode)) {
      this.errorMessage =
        'Vui lòng nhập đầy đủ 6 chữ số OTP.';
      return;
    }

    // Chuyển sang giao diện đặt lại mật khẩu.
    // Chưa xác minh OTP với backend ở bước này.
    this.isLoading = true;
    this.adminPasswordReset
      .verifyOtp({ Email: this.email, otpCode: this.otpCode })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/admin/reset-password'], {
            state: {
              email: this.email,
              otpCode: this.otpCode,
            },
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.';
        },
      });
  }
}
