import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  email = '';
  password = '';
  

  showPassword = false;


  failedAttempts = 0;
  isLocked = false;
  isLoading = false;
  countdown = 0;
  timerInterval: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']); 
      return; 
    }
    this.checkLockout(); 
  }


  checkLockout() {
    const lockUntil = localStorage.getItem('lockUntil');
    if (lockUntil) {
      const timeLeft = parseInt(lockUntil) - Date.now();
      if (timeLeft > 0) {
        this.isLocked = true;
        this.startCountdown(Math.ceil(timeLeft / 1000));
      } else {
        localStorage.removeItem('lockUntil');
        localStorage.setItem('failedAttempts', '0');
        this.failedAttempts = 0;
      }
    } else {
      this.failedAttempts = parseInt(localStorage.getItem('failedAttempts') || '0');
    }
  }

  startCountdown(seconds: number) {
    this.countdown = seconds;
    this.timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timerInterval);
        this.isLocked = false;
        localStorage.removeItem('lockUntil');
        localStorage.setItem('failedAttempts', '0');
        this.failedAttempts = 0;
      }
    }, 1000);
  }

  onSubmit() {
    if (this.isLocked || this.isLoading) return;

    if (!this.email.trim() || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Đăng nhập thất bại',
        text: 'Vui lòng nhập email và mật khẩu.',
        confirmButtonColor: '#2563B0'
      });
      return;
    }

    const loginData = { Email: this.email.trim(), Password: this.password };
    this.isLoading = true;

    this.authService.login(loginData).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          localStorage.setItem('failedAttempts', '0');
          
          Swal.fire({
            icon: 'success',
            title: 'Đăng nhập thành công!',
            text: `Chào mừng ${res.user.Full_name}`,
            showConfirmButton: false,
            timer: 2000
          }).then(() => {
            this.router.navigate(['/']);
          });
          return;
        }

        this.handleFailedAttempt(res.message || 'Email hoặc mật khẩu không đúng.');
      },
      error: (err) => {
        this.handleFailedAttempt(
          err.status === 0
            ? 'Không thể kết nối máy chủ. Vui lòng thử lại.'
            : err.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.',
        );
      }
    });
  }

  private handleFailedAttempt(message: string): void {
    this.failedAttempts++;
    localStorage.setItem('failedAttempts', this.failedAttempts.toString());

    if (this.failedAttempts >= 5) {
      const lockTime = Date.now() + 60 * 1000;
      localStorage.setItem('lockUntil', lockTime.toString());
      this.isLocked = true;
      this.startCountdown(60);

      Swal.fire({
        icon: 'error',
        title: 'Tạm khóa đăng nhập',
        text: 'Bạn đã nhập sai 5 lần. Vui lòng thử lại sau 1 phút!',
        confirmButtonColor: '#2563B0'
      });
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'Đăng nhập thất bại',
      text: `${message} (${this.failedAttempts}/5 lần)`,
      confirmButtonColor: '#2563B0'
    });
  }
}