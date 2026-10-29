import {
  formatPhoneNumber,
  normalizeEmail,
  normalizeFullName,
  normalizePhone,
  validateEmail,
  validateFullName,
  validatePhone,
} from './admin-staff-validation';

describe('admin-staff-validation', () => {
  describe('validateFullName', () => {
    it.each([
      ['Nguyễn Minh Anh', 'Nguyễn Minh Anh'],
      ['  Trần   Thị    Bích  ', 'Trần Thị Bích'],
      ["O'Brien Smith", "O'Brien Smith"],
      ['Jean-Luc Picard', 'Jean-Luc Picard'],
      ['Nguyễn Văn A.', 'Nguyễn Văn A.'],
      ['Nguye\u0302\u0303n An', 'Nguyễn An'], // dạng NFD (chữ + dấu rời) → NFC
    ])('chấp nhận và chuẩn hóa "%s"', (input, expected) => {
      expect(validateFullName(input).value).toBe(expected);
    });

    it.each([
      ['', 'Vui lòng nhập họ và tên'],
      ['   ', 'Vui lòng nhập họ và tên'],
      ['Nguyễn', 'Vui lòng nhập đầy đủ họ và tên (ít nhất 2 từ)'],
      ['Nguyễn 2', 'Họ và tên không được chứa chữ số'],
      ['Nguyễn@An', "Họ và tên chỉ được chứa chữ cái, khoảng trắng và các dấu ' - ."],
      ['An-', "Họ và tên không hợp lệ (dấu ' - . đặt sai vị trí)"],
      ['-An Bình', "Họ và tên không hợp lệ (dấu ' - . đặt sai vị trí)"],
      ['A '.repeat(60), 'Họ và tên không được vượt quá 100 ký tự'],
    ])('từ chối "%s"', (input, message) => {
      expect(validateFullName(input).error).toBe(message);
    });
  });

  describe('validateEmail', () => {
    it('chuẩn hóa về chữ thường và bỏ khoảng trắng hai đầu', () => {
      expect(validateEmail('  Ten.Nguoi+tag@Mail.Vista.VN ').value).toBe('ten.nguoi+tag@mail.vista.vn');
    });

    it.each([
      ['', 'Vui lòng nhập email'],
      ['abc', 'Email phải có ký tự @ (ví dụ: ten@congty.com)'],
      ['a b@c.vn', 'Email không được chứa khoảng trắng'],
      ['a@b@c.vn', 'Email chỉ được chứa một ký tự @'],
      ['@b.vn', 'Thiếu phần tên đứng trước ký tự @'],
      ['a@', 'Thiếu tên miền sau ký tự @ (ví dụ: gmail.com)'],
      ['a@b', 'Tên miền không hợp lệ (ví dụ: gmail.com)'],
      ['a@b.c', 'Đuôi tên miền không hợp lệ (ví dụ: .com, .vn)'],
      ['a@-b.vn', 'Tên miền không hợp lệ (chỉ gồm chữ cái không dấu, số và dấu - giữa các phần)'],
      [
        'a..b@c.vn',
        'Phần đứng trước @ chỉ gồm chữ cái không dấu, số và các ký tự . _ + - (không đặt ở đầu, cuối hoặc liền nhau)',
      ],
    ])('từ chối "%s"', (input, message) => {
      expect(validateEmail(input).error).toBe(message);
    });
  });

  describe('validatePhone', () => {
    it.each([
      ['', ''],
      ['0903123456', '0903123456'],
      ['0903 123 456', '0903123456'],
      ['0903.123.456', '0903123456'],
      ['(+84) 903 123 456', '0903123456'],
      ['+84903123456', '0903123456'],
      ['84903123456', '0903123456'],
    ])('chấp nhận "%s"', (input, expected) => {
      expect(validatePhone(input).value).toBe(expected);
    });

    it.each([
      ['123', 'Số điện thoại phải bắt đầu bằng 0 (hoặc +84)'],
      ['090312345', 'Số điện thoại phải gồm 10 chữ số'],
      ['0123456789', 'Đầu số không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08 hoặc 09)'],
      ['09a3123456', 'Số điện thoại chỉ được chứa chữ số'],
      ['090+3123456', 'Dấu + chỉ được đặt ở đầu số điện thoại'],
    ])('từ chối "%s"', (input, message) => {
      expect(validatePhone(input).error).toBe(message);
    });
  });

  describe('chuẩn hóa & định dạng', () => {
    it('normalizeFullName gộp khoảng trắng', () => {
      expect(normalizeFullName('  An   Bình ')).toBe('An Bình');
    });

    it('normalizeEmail về chữ thường', () => {
      expect(normalizeEmail(' A@B.VN ')).toBe('a@b.vn');
    });

    it('normalizePhone đổi +84 / 84 thành 0', () => {
      expect(normalizePhone('+84 903 123 456')).toBe('0903123456');
      expect(normalizePhone('84903123456')).toBe('0903123456');
    });

    it('formatPhoneNumber chia nhóm 4-3-3, giữ nguyên số không đủ 10 chữ số', () => {
      expect(formatPhoneNumber('0903123456')).toBe('0903 123 456');
      expect(formatPhoneNumber('12345')).toBe('12345');
      expect(formatPhoneNumber(null)).toBe('');
    });
  });
});
