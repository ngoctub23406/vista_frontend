import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminAccountService } from '../../services/admin-account';
import { AdminChangePassword } from './admin-change-password';

describe('AdminChangePassword', () => {
  let component: AdminChangePassword;
  let fixture: ComponentFixture<AdminChangePassword>;
  let adminAccount: { changePassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    adminAccount = { changePassword: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminChangePassword],
      providers: [
        provideRouter([]),
        { provide: AdminAccountService, useValue: adminAccount },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AdminChangePassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validates required fields without calling the API', () => {
    component.onSubmit(new Event('submit'));

    expect(component.errorMessage).toBe('Vui lòng nhập đầy đủ thông tin.');
    expect(adminAccount.changePassword).not.toHaveBeenCalled();
  });

  it('rejects mismatched confirmation without calling the API', () => {
    component.currentPassword = 'old-password';
    component.newPassword = 'new-password';
    component.confirmPassword = 'different-password';

    component.onSubmit(new Event('submit'));

    expect(component.errorMessage).toBe('Mật khẩu mới và xác nhận mật khẩu không khớp.');
    expect(adminAccount.changePassword).not.toHaveBeenCalled();
  });

  it('clears the password fields only after backend confirms success', () => {
    adminAccount.changePassword.mockReturnValue(of({
      success: true,
      message: 'Đổi mật khẩu thành công.',
    }));
    component.currentPassword = 'old-password';
    component.newPassword = 'new-password';
    component.confirmPassword = 'new-password';

    component.onSubmit(new Event('submit'));

    expect(component.viewState).toBe('success');
    expect(component.currentPassword).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('shows backend errors and ends loading after a failed request', () => {
    adminAccount.changePassword.mockReturnValue(throwError(() => ({
      error: { message: 'Mật khẩu hiện tại không đúng.' },
    })));
    component.currentPassword = 'wrong-password';
    component.newPassword = 'new-password';
    component.confirmPassword = 'new-password';

    component.onSubmit(new Event('submit'));

    expect(component.viewState).toBe('form');
    expect(component.errorMessage).toBe('Mật khẩu hiện tại không đúng.');
  });
});
