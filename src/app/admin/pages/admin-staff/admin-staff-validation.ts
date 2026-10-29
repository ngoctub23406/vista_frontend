// Quy tắc kiểm tra form Thêm / Chỉnh sửa nhân viên (họ tên, email, số điện thoại).
// Dùng để báo lỗi ngay khi nhập. Backend (vista_api/controllers/admin/staff.validation.js) áp dụng
// đúng các quy tắc và thông báo này khi lưu, nên hai nơi phải luôn giống nhau.

export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_EMAIL_LOCAL_LENGTH = 64;
export const MAX_DOMAIN_LABEL_LENGTH = 63;

/** Kết quả kiểm tra: có `error` (thông báo cho người dùng) hoặc `value` (đã chuẩn hóa để lưu). */
export type FieldValidation = { error: string; value?: undefined } | { error?: undefined; value: string };

// Một "từ" của họ tên: chữ cái (có dấu), các phần nối bằng ' . - và có thể kết thúc bằng dấu chấm (chữ viết tắt "A.")
const NAME_WORD_PATTERN = /^[\p{L}\p{M}]+(?:['’.-][\p{L}\p{M}]+)*\.?$/u;
const NAME_INVALID_CHAR_PATTERN = /[^\p{L}\p{M}\s'’.-]/u;

// Phần trước @: chữ thường a-z, số; các ký tự . _ + - chỉ nằm giữa, không đứng đầu / cuối / liền nhau
const EMAIL_LOCAL_PATTERN = /^[a-z0-9]+(?:[._+-][a-z0-9]+)*$/;
const EMAIL_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const EMAIL_TLD_PATTERN = /^[a-z]{2,63}$/;

// Số di động Việt Nam: 0 + đầu số 3/5/7/8/9 + 8 chữ số
const PHONE_PATTERN = /^0[35789]\d{8}$/;

/** Gộp khoảng trắng thừa, chuẩn hóa Unicode (NFC) để chữ có dấu luôn cùng một dạng. */
export function normalizeFullName(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Bỏ khoảng trắng / dấu chấm / gạch / ngoặc; đổi +84 hoặc 84 (đủ 11 số) thành 0. */
export function normalizePhone(value: string): string {
  const compact = value.replace(/[\s.\-()]/g, '');
  if (/^\+84\d{9}$/.test(compact)) return `0${compact.slice(3)}`;
  if (/^84\d{9}$/.test(compact)) return `0${compact.slice(2)}`;
  return compact;
}

/** 0903123456 → 0903 123 456 (số không đủ 10 chữ số giữ nguyên). */
export function formatPhoneNumber(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return String(phone ?? '').trim();
}

export function validateFullName(input: string): FieldValidation {
  const name = normalizeFullName(input);

  if (!name) return { error: 'Vui lòng nhập họ và tên' };
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Họ và tên không được vượt quá ${MAX_NAME_LENGTH} ký tự` };
  }
  if (/\d/.test(name)) return { error: 'Họ và tên không được chứa chữ số' };
  if (NAME_INVALID_CHAR_PATTERN.test(name)) {
    return { error: "Họ và tên chỉ được chứa chữ cái, khoảng trắng và các dấu ' - ." };
  }

  const words = name.split(' ');
  if (!words.every((word) => NAME_WORD_PATTERN.test(word))) {
    return { error: "Họ và tên không hợp lệ (dấu ' - . đặt sai vị trí)" };
  }
  if (words.length < 2) return { error: 'Vui lòng nhập đầy đủ họ và tên (ít nhất 2 từ)' };

  return { value: name };
}

export function validateEmail(input: string): FieldValidation {
  const email = normalizeEmail(input);

  if (!email) return { error: 'Vui lòng nhập email' };
  if (/\s/.test(email)) return { error: 'Email không được chứa khoảng trắng' };
  if (email.length > MAX_EMAIL_LENGTH) {
    return { error: `Email không được vượt quá ${MAX_EMAIL_LENGTH} ký tự` };
  }

  const at = email.indexOf('@');
  if (at === -1) return { error: 'Email phải có ký tự @ (ví dụ: ten@congty.com)' };
  if (email.indexOf('@', at + 1) !== -1) return { error: 'Email chỉ được chứa một ký tự @' };

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (!local) return { error: 'Thiếu phần tên đứng trước ký tự @' };
  if (local.length > MAX_EMAIL_LOCAL_LENGTH) {
    return { error: `Phần đứng trước @ không được vượt quá ${MAX_EMAIL_LOCAL_LENGTH} ký tự` };
  }
  if (!EMAIL_LOCAL_PATTERN.test(local)) {
    return {
      error: 'Phần đứng trước @ chỉ gồm chữ cái không dấu, số và các ký tự . _ + - (không đặt ở đầu, cuối hoặc liền nhau)',
    };
  }

  if (!domain) return { error: 'Thiếu tên miền sau ký tự @ (ví dụ: gmail.com)' };

  const labels = domain.split('.');
  if (labels.length < 2) return { error: 'Tên miền không hợp lệ (ví dụ: gmail.com)' };
  if (labels.some((label) => !label || label.length > MAX_DOMAIN_LABEL_LENGTH || !EMAIL_LABEL_PATTERN.test(label))) {
    return { error: 'Tên miền không hợp lệ (chỉ gồm chữ cái không dấu, số và dấu - giữa các phần)' };
  }
  if (!EMAIL_TLD_PATTERN.test(labels[labels.length - 1])) {
    return { error: 'Đuôi tên miền không hợp lệ (ví dụ: .com, .vn)' };
  }

  return { value: email };
}

/** Số điện thoại không bắt buộc: để trống là hợp lệ (value = ''). */
export function validatePhone(input: string): FieldValidation {
  const raw = input.trim();
  if (!raw) return { value: '' };

  if (/[^\d\s.\-()+]/.test(raw)) return { error: 'Số điện thoại chỉ được chứa chữ số' };

  const compact = raw.replace(/[\s.\-()]/g, '');
  if (!/^\+?\d*$/.test(compact)) return { error: 'Dấu + chỉ được đặt ở đầu số điện thoại' };

  const phone = normalizePhone(raw);
  if (!phone.startsWith('0')) return { error: 'Số điện thoại phải bắt đầu bằng 0 (hoặc +84)' };
  if (phone.length !== 10) return { error: 'Số điện thoại phải gồm 10 chữ số' };
  if (!PHONE_PATTERN.test(phone)) {
    return { error: 'Đầu số không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08 hoặc 09)' };
  }

  return { value: phone };
}
