import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { getAdminRole } from './admin-guard';

// Chức năng chỉ dành cho Manager (vd. Quản lý nhân sự).
// Staff gõ trực tiếp đường dẫn sẽ được chuyển về trang Xử lý đơn hàng;
// quyền thật vẫn được backend kiểm tra ở từng API.
export const adminManagerGuard: CanActivateFn = (): boolean | UrlTree => {
  if (getAdminRole() === 'Manager') {
    return true;
  }

  return inject(Router).createUrlTree(['/admin/orders']);
};
