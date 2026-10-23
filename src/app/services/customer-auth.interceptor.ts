import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Các địa chỉ API của VISTA (không gắn token cho API bên ngoài như danh sách tỉnh/thành)
const API_PREFIXES = [environment.apiUrl, 'http://localhost:5000/api', '/api'];

function isVistaApi(url: string): boolean {
  return API_PREFIXES.some((prefix) => url.startsWith(`${prefix}/`) || url === prefix);
}

/**
 * Tự gắn token của khách (localStorage "token") vào mọi request tới API VISTA.
 * Request đã có Authorization (ví dụ các service Admin) thì giữ nguyên.
 */
export const customerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('Authorization') || !isVistaApi(req.url)) {
    return next(req);
  }

  const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
