import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideX,
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideTriangleAlert,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import {
  AdminStaffApiResponse,
  AdminStaffMember,
  AdminStaffPayload,
  AdminStaffService,
  StaffRole,
  StaffStatus,
} from '../../services/admin-staff';
import {
  FieldValidation,
  formatPhoneNumber,
  normalizeEmail,
  normalizeFullName,
  normalizePhone,
  validateEmail,
  validateFullName,
  validatePhone,
} from './admin-staff-validation';

type StaffModal = 'view' | 'add' | 'edit' | 'lock' | 'unlock';
type FormField = 'Full_name' | 'Email' | 'Phone_number';

interface StaffForm {
  Full_name: string;
  Email: string;
  Phone_number: string;
  Role: 'Staff';
  Status: StaffStatus;
}

const ROLE_LABELS: Record<StaffRole, string> = {
  Manager: 'Store Manager',
  Staff: 'Staff',
};

const STATUS_LABELS: Record<StaffStatus, string> = {
  active: 'Đang hoạt động',
  blocked: 'Tạm khóa',
};

const FORM_FIELDS: FormField[] = ['Full_name', 'Email', 'Phone_number'];
const FIELD_IDS: Record<FormField, string> = {
  Full_name: 'staff-full-name',
  Email: 'staff-email',
  Phone_number: 'staff-phone',
};
const TAKEN_MESSAGES: Partial<Record<FormField, string>> = {
  Email: 'Email đã được sử dụng',
  Phone_number: 'Số điện thoại đã được sử dụng',
};

// Chờ người dùng ngừng gõ rồi mới hỏi máy chủ xem email / số điện thoại đã được dùng chưa
const AVAILABILITY_DELAY_MS = 350;

// Popup thông báo dùng chung kiểu với các chức năng khác (SweetAlert2, hiện giữa màn hình)
const NOTICE_BUTTON_COLOR = '#2563B0';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideSearch,
      lucideX,
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideTriangleAlert,
      lucideRefreshCw,
    }),
  ],
  templateUrl: './admin-staff.html',
  styleUrl: './admin-staff.scss',
})
export class AdminStaff implements OnInit, OnDestroy {
  readonly roleOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'Manager', label: ROLE_LABELS.Manager },
    { value: 'Staff', label: ROLE_LABELS.Staff },
  ];
  readonly statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: STATUS_LABELS.active },
    { value: 'blocked', label: STATUS_LABELS.blocked },
  ];
  readonly formStatusOptions: { value: StaffStatus; label: string }[] = [
    { value: 'active', label: STATUS_LABELS.active },
    { value: 'blocked', label: STATUS_LABELS.blocked },
  ];
  readonly pageSizeOptions = [10, 20, 50];

  // Bộ lọc & phân trang
  keyword = '';
  roleFilter = '';
  statusFilter = '';
  page = 1;
  limit = 10;

  staff: AdminStaffMember[] = [];
  total = 0;
  systemTotal = 0;
  isLoading = false;
  loadError = '';

  // Popup (Xem / Thêm / Chỉnh sửa / Khóa / Mở khóa)
  modal: StaffModal | null = null;
  target: AdminStaffMember | null = null;
  form: StaffForm = this.emptyForm();
  fieldErrors: Partial<Record<FormField, string>> = {};
  // Ô đang chờ máy chủ kiểm tra trùng email / số điện thoại
  checking: Partial<Record<FormField, boolean>> = {};
  isSubmitting = false;
  // Id nhân viên đang được tải chi tiết (Xem / Chỉnh sửa) để chặn bấm lặp
  openingId = '';

  // Giá trị máy chủ đã báo là bị trùng / không trùng (để không hỏi lại và không mất lỗi khi rời ô)
  private takenValues: Partial<Record<FormField, string>> = {};
  private checkedValues: Partial<Record<FormField, string>> = {};
  private availabilityTimers: Partial<Record<FormField, ReturnType<typeof setTimeout>>> = {};
  private availabilityTokens: Record<FormField, number> = { Full_name: 0, Email: 0, Phone_number: 0 };

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly staffService: AdminStaffService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
    this.cancelAvailabilityChecks();
  }

  // ===== Danh sách =====

  loadStaff(): void {
    this.isLoading = true;
    this.loadError = '';

    this.staffService
      .getStaffList({
        keyword: this.keyword.trim(),
        role: this.roleFilter,
        status: this.statusFilter,
        page: this.page,
        limit: this.limit,
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.staff = response.data?.items ?? [];
          this.total = response.data?.total ?? 0;
          this.systemTotal = response.data?.system_total ?? 0;

          // Trang hiện tại không còn dữ liệu (vd. vừa đổi bộ lọc) → quay về trang cuối còn dữ liệu
          if (!this.staff.length && this.total > 0 && this.page > 1) {
            this.page = this.totalPages;
            this.loadStaff();
          }
        },
        error: (error: unknown) => {
          this.staff = [];
          this.total = 0;
          this.loadError = this.getErrorMessage(error, 'Không tải được danh sách nhân viên. Vui lòng thử lại.');
        },
      });
  }

  onKeywordChange(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 400);
  }

  applyFilters(): void {
    this.page = 1;
    this.loadStaff();
  }

  clearFilters(): void {
    this.keyword = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  get hasFilters(): boolean {
    return !!(this.keyword.trim() || this.roleFilter || this.statusFilter);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  // Phân trang rút gọn: 1 … 4 5 6 … 22 (null = dấu …)
  get pageItems(): (number | null)[] {
    const total = this.totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const start = Math.max(2, Math.min(this.page - 1, total - 4));
    const end = Math.min(total - 1, Math.max(this.page + 1, 5));
    const items: (number | null)[] = [1];

    if (start > 2) items.push(null);
    for (let number = start; number <= end; number++) items.push(number);
    if (end < total - 1) items.push(null);
    items.push(total);

    return items;
  }

  get rangeStart(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  get rangeText(): string {
    return this.total === 0
      ? 'Hiển thị 0 / 0 nhân viên'
      : `Hiển thị ${this.rangeStart}–${this.rangeEnd} / ${this.total} nhân viên`;
  }

  get subtitle(): string {
    return this.hasFilters
      ? `${this.total} nhân viên phù hợp`
      : `${this.total} nhân viên trong hệ thống`;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }

    this.page = page;
    this.loadStaff();
  }

  trackByUserId(_index: number, member: AdminStaffMember): string {
    return member.User_id;
  }

  // ===== Hiển thị =====

  getRoleLabel(role: StaffRole): string {
    return ROLE_LABELS[role] ?? role;
  }

  getStatusLabel(status: StaffStatus): string {
    return STATUS_LABELS[status] ?? STATUS_LABELS.active;
  }

  // 0903123456 → 0903 123 456 (số không đủ 10 chữ số giữ nguyên)
  formatPhone(phone: string | null | undefined): string {
    return formatPhoneNumber(phone);
  }

  // Manager chỉ được thêm / sửa / khóa tài khoản Staff
  canManage(member: AdminStaffMember): boolean {
    return member.Role === 'Staff';
  }

  isBlocked(member: AdminStaffMember): boolean {
    return member.Status === 'blocked';
  }

  // ===== Popup =====

  openAdd(): void {
    this.target = null;
    this.form = this.emptyForm();
    this.resetModalState();
    this.modal = 'add';
  }

  // Xem / Chỉnh sửa: lấy dữ liệu mới nhất của nhân viên từ API trước khi mở popup
  openWithDetail(member: AdminStaffMember, mode: 'view' | 'edit'): void {
    if (this.openingId) {
      return;
    }

    this.openingId = member.User_id;

    this.staffService
      .getStaffDetail(member.User_id)
      .pipe(
        finalize(() => {
          this.openingId = '';
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          const detail = response.data;
          if (!detail) {
            this.notifyError('Không tải được thông tin nhân viên.');
            return;
          }

          this.target = detail;
          this.form = {
            Full_name: detail.Full_name,
            Email: detail.Email,
            Phone_number: this.formatPhone(detail.Phone_number),
            Role: 'Staff',
            Status: detail.Status,
          };
          this.resetModalState();
          this.modal = mode;

          // Dữ liệu cũ trong DB có thể không đạt quy tắc hiện tại: báo lỗi ngay khi mở form, không đợi bấm Lưu
          if (mode === 'edit') {
            this.validateAllFields();
          }
        },
        error: (error: unknown) => {
          this.notifyError(this.getErrorMessage(error, 'Không tải được thông tin nhân viên.'));
          // Nhân viên có thể đã bị xóa / đổi: tải lại danh sách cho khớp dữ liệu
          this.loadStaff();
        },
      });
  }

  openConfirm(member: AdminStaffMember, mode: 'lock' | 'unlock'): void {
    this.target = member;
    this.resetModalState();
    this.modal = mode;
  }

  closeModal(): void {
    if (this.isSubmitting) {
      return;
    }

    this.modal = null;
    this.target = null;
    this.resetModalState();
  }

  get modalTitle(): string {
    switch (this.modal) {
      case 'add':
        return 'Thêm nhân viên';
      case 'edit':
        return 'Chỉnh sửa nhân viên';
      case 'view':
        return 'Thông tin nhân viên';
      case 'lock':
        return 'Khóa nhân viên?';
      case 'unlock':
        return 'Mở khóa nhân viên?';
      default:
        return '';
    }
  }

  get modalDescription(): string {
    switch (this.modal) {
      case 'add':
        return 'Nhập thông tin để tạo hồ sơ và cấp quyền truy cập cho nhân viên mới.';
      case 'edit':
        return `Cập nhật thông tin và quyền truy cập của ${this.target?.Full_name ?? ''}.`;
      case 'view':
        return `Thông tin và quyền truy cập của ${this.target?.Full_name ?? ''}.`;
      case 'lock':
        return 'Nhân viên sẽ không thể đăng nhập và truy cập Admin Portal sau khi bị khóa. Bạn có thể mở khóa lại bất cứ lúc nào.';
      case 'unlock':
        return 'Nhân viên sẽ có thể đăng nhập và truy cập Admin Portal trở lại với vai trò đã được cấp.';
      default:
        return '';
    }
  }

  get isFormModal(): boolean {
    return this.modal === 'add' || this.modal === 'edit' || this.modal === 'view';
  }

  get isConfirmModal(): boolean {
    return this.modal === 'lock' || this.modal === 'unlock';
  }

  get confirmLabel(): string {
    return this.modal === 'unlock' ? 'Mở khóa nhân viên' : 'Khóa nhân viên';
  }

  get isEditableForm(): boolean {
    return this.modal === 'add' || this.modal === 'edit';
  }

  get hasFieldErrors(): boolean {
    return Object.values(this.fieldErrors).some(Boolean);
  }

  // ===== Kiểm tra khi nhập =====

  // Gõ tới đâu báo lỗi tới đó
  onFieldInput(field: FormField): void {
    if (!this.isEditableForm) {
      return;
    }

    this.validatePrecedingFields(field);
    this.refreshField(field, false);
  }

  // Rời ô: gọn lại giá trị (bỏ khoảng trắng thừa, email chữ thường, SĐT định dạng) rồi kiểm tra lại
  onFieldBlur(field: FormField): void {
    if (!this.isEditableForm) {
      return;
    }

    this.validatePrecedingFields(field);
    this.tidyField(field);
    this.refreshField(field, true);
  }

  // Người dùng đã sang ô sau mà bỏ qua ô trước (vd. chưa nhập email đã gõ số điện thoại) → báo lỗi ô trước ngay
  private validatePrecedingFields(field: FormField): void {
    FORM_FIELDS.slice(0, FORM_FIELDS.indexOf(field)).forEach((previous) =>
      this.setFieldError(previous, this.currentError(previous)),
    );
  }

  // Kiểm tra cả 3 ô và hiện lỗi (nếu có) ngay, coi như người dùng đã chạm tới từng ô
  private validateAllFields(): void {
    FORM_FIELDS.forEach((field) => this.setFieldError(field, this.currentError(field)));
  }

  private refreshField(field: FormField, checkNow: boolean): void {
    this.cancelAvailabilityCheck(field);
    this.setFieldError(field, this.currentError(field));

    if (!this.fieldErrors[field]) {
      this.scheduleAvailabilityCheck(field, checkNow);
    }
  }

  private validateField(field: FormField): FieldValidation {
    switch (field) {
      case 'Full_name':
        return validateFullName(this.form.Full_name);
      case 'Email':
        return validateEmail(this.form.Email);
      default:
        return validatePhone(this.form.Phone_number);
    }
  }

  // Lỗi hiện tại của một ô: sai quy tắc, hoặc (đã hỏi máy chủ) bị trùng với tài khoản khác
  private currentError(field: FormField): string {
    const result = this.validateField(field);

    if (result.error) {
      return result.error;
    }

    const value = result.value;
    return value && this.takenValues[field] === value ? (TAKEN_MESSAGES[field] ?? '') : '';
  }

  private setFieldError(field: FormField, message: string): void {
    this.fieldErrors = { ...this.fieldErrors, [field]: message || undefined };
  }

  private tidyField(field: FormField): void {
    if (field === 'Full_name') {
      this.form.Full_name = normalizeFullName(this.form.Full_name);
    } else if (field === 'Email') {
      this.form.Email = normalizeEmail(this.form.Email);
    } else {
      const result = validatePhone(this.form.Phone_number);
      this.form.Phone_number = result.value ? formatPhoneNumber(result.value) : this.form.Phone_number.trim();
    }
  }

  // ----- Kiểm tra trùng email / số điện thoại với tài khoản khác (hỏi máy chủ) -----

  private scheduleAvailabilityCheck(field: FormField, checkNow: boolean): void {
    if (field === 'Full_name') {
      return;
    }

    const value = this.validateField(field).value;

    if (!value || this.isOriginalValue(field, value) || this.checkedValues[field] === value) {
      return;
    }

    if (checkNow) {
      this.runAvailabilityCheck(field, value);
      return;
    }

    this.availabilityTimers[field] = setTimeout(() => this.runAvailabilityCheck(field, value), AVAILABILITY_DELAY_MS);
  }

  // Đang sửa: giá trị giữ nguyên như cũ thì không thể trùng với người khác
  private isOriginalValue(field: FormField, value: string): boolean {
    if (this.modal !== 'edit' || !this.target) {
      return false;
    }

    const original =
      field === 'Email' ? normalizeEmail(this.target.Email ?? '') : normalizePhone(this.target.Phone_number ?? '');
    return value === original;
  }

  private runAvailabilityCheck(field: FormField, value: string): void {
    const token = ++this.availabilityTokens[field];
    this.checking[field] = true;
    this.changeDetectorRef.detectChanges();

    const values = field === 'Email' ? { email: value } : { phone: value };

    this.staffService.checkAvailability(values, this.target?.User_id).subscribe({
      next: (response) => {
        if (token !== this.availabilityTokens[field]) {
          return;
        }

        this.checking[field] = false;
        const taken = field === 'Email' ? response.data?.email_taken : response.data?.phone_taken;

        if (taken) {
          this.takenValues[field] = value;
        } else {
          this.checkedValues[field] = value;
        }

        this.setFieldError(field, this.currentError(field));
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        // Không kiểm tra được (mạng...): bỏ qua, máy chủ vẫn kiểm tra lại khi bấm Lưu
        if (token === this.availabilityTokens[field]) {
          this.checking[field] = false;
          this.changeDetectorRef.detectChanges();
        }
      },
    });
  }

  private cancelAvailabilityCheck(field: FormField): void {
    clearTimeout(this.availabilityTimers[field]);
    // Đổi số thứ tự để bỏ qua câu trả lời của yêu cầu cũ nếu nó về muộn
    this.availabilityTokens[field] += 1;
    this.checking[field] = false;
  }

  private cancelAvailabilityChecks(): void {
    FORM_FIELDS.forEach((field) => this.cancelAvailabilityCheck(field));
  }

  // ===== Gửi dữ liệu =====

  submitForm(): void {
    if (this.isSubmitting || !this.isEditableForm) {
      return;
    }

    // Bấm Lưu: coi mọi ô đã chạm tới, kiểm tra lại toàn bộ rồi đưa con trỏ tới ô lỗi đầu tiên
    FORM_FIELDS.forEach((field) => this.tidyField(field));
    this.validateAllFields();

    const firstInvalid = FORM_FIELDS.find((field) => this.fieldErrors[field]);
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    const payload: AdminStaffPayload = {
      Full_name: validateFullName(this.form.Full_name).value ?? '',
      Email: validateEmail(this.form.Email).value ?? '',
      Phone_number: validatePhone(this.form.Phone_number).value ?? '',
      Role: 'Staff',
      Status: this.form.Status,
    };

    const isAdd = this.modal === 'add';
    const request: Observable<AdminStaffApiResponse<AdminStaffMember>> = isAdd
      ? this.staffService.createStaff(payload)
      : this.staffService.updateStaff(this.target?.User_id ?? '', payload);

    this.runModalRequest(
      request,
      (name) =>
        isAdd
          ? { title: 'Thêm nhân viên thành công!', text: `Nhân viên "${name}" đã được thêm vào hệ thống.` }
          : { title: 'Cập nhật thành công!', text: `Thông tin nhân viên "${name}" đã được cập nhật.` },
      isAdd ? 'Không thể thêm nhân viên. Vui lòng thử lại.' : 'Không thể cập nhật nhân viên. Vui lòng thử lại.',
      isAdd,
    );
  }

  confirmStatusChange(): void {
    if (this.isSubmitting || !this.target || !this.isConfirmModal) {
      return;
    }

    const isLock = this.modal === 'lock';
    const request = isLock
      ? this.staffService.lockStaff(this.target.User_id)
      : this.staffService.unlockStaff(this.target.User_id);

    this.runModalRequest(
      request,
      (name) =>
        isLock
          ? {
              title: 'Đã khóa nhân viên!',
              text: `"${name}" sẽ không thể đăng nhập Admin Portal cho đến khi được mở khóa.`,
            }
          : {
              title: 'Đã mở khóa nhân viên!',
              text: `"${name}" có thể đăng nhập và truy cập Admin Portal trở lại.`,
            },
      isLock ? 'Không thể khóa nhân viên. Vui lòng thử lại.' : 'Không thể mở khóa nhân viên. Vui lòng thử lại.',
      false,
    );
  }

  private runModalRequest(
    request: Observable<AdminStaffApiResponse<AdminStaffMember>>,
    successNotice: (name: string) => { title: string; text: string },
    fallbackError: string,
    goToLastPage: boolean,
  ): void {
    this.isSubmitting = true;

    request
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          const name = response.data?.Full_name || this.target?.Full_name || '';
          const notice = successNotice(name);

          this.isSubmitting = false;
          this.closeModal();
          this.notifySuccess(notice.title, notice.text);
          // Danh sách xếp theo ngày tham gia tăng dần: nhân viên mới nằm cuối, đi tới trang cuối để thấy ngay
          // (nếu bộ lọc đang ẩn nhân viên mới thì loadStaff tự lùi về trang cuối còn dữ liệu)
          if (goToLastPage) {
            this.page = Math.max(1, Math.ceil((this.total + 1) / this.limit));
          }
          this.loadStaff();
        },
        error: (error: unknown) => {
          const message = this.getErrorMessage(error, fallbackError);
          const status = this.getErrorStatus(error);

          if (this.isEditableForm) {
            // Lỗi nhập liệu / trùng dữ liệu: đánh dấu đúng ô, giữ nguyên popup để sửa
            this.applyServerError(message, this.getErrorField(error));
            this.notifyError(message);
            return;
          }

          // Khóa / mở khóa: trạng thái đã bị thay đổi ở nơi khác (409) hoặc nhân viên không còn → tải lại
          this.notifyError(message);
          if (status === 409 || status === 404 || status === 403) {
            this.isSubmitting = false;
            this.closeModal();
            this.loadStaff();
          }
        },
      });
  }

  // Lỗi từ máy chủ (vd. bị người khác dùng trước): gắn vào ô tương ứng
  private applyServerError(message: string, field: FormField | null): void {
    const target = field ?? this.guessFieldFromMessage(message);
    if (!target) {
      return;
    }

    const value = this.validateField(target).value;
    if (value && TAKEN_MESSAGES[target] === message) {
      this.takenValues[target] = value;
    }

    this.setFieldError(target, message);
  }

  private guessFieldFromMessage(message: string): FormField | null {
    const lower = message.toLowerCase();
    if (lower.includes('email')) return 'Email';
    if (lower.includes('số điện thoại')) return 'Phone_number';
    if (lower.includes('họ và tên')) return 'Full_name';
    return null;
  }

  // ===== Tiện ích =====

  private emptyForm(): StaffForm {
    return { Full_name: '', Email: '', Phone_number: '', Role: 'Staff', Status: 'active' };
  }

  private resetModalState(): void {
    this.cancelAvailabilityChecks();
    this.fieldErrors = {};
    this.takenValues = {};
    this.checkedValues = {};
  }

  @HostListener('document:keydown.escape', ['$event'])
  closeModalOnEscape(event?: Event): void {
    // Esc đang dùng để đóng popup thông báo (SweetAlert2 đã xử lý phím này) thì không đóng luôn popup nhập liệu phía sau
    if (event?.defaultPrevented || Swal.isVisible()) {
      return;
    }

    this.closeModal();
  }

  // ===== Popup thông báo (giữa màn hình, cùng kiểu các chức năng khác) =====

  private notifySuccess(title: string, text: string): void {
    void Swal.fire({ icon: 'success', title, text, confirmButtonColor: NOTICE_BUTTON_COLOR });
  }

  private notifyError(text: string): void {
    void Swal.fire({ icon: 'error', title: 'Thất bại', text, confirmButtonColor: NOTICE_BUTTON_COLOR });
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
      if ('error' in error && typeof error.error === 'object' && error.error !== null &&
          'message' in error.error && typeof error.error.message === 'string' && error.error.message) {
        return error.error.message;
      }

      if (error instanceof Error && error.message === 'Vui lòng đăng nhập lại để tiếp tục.') {
        return error.message;
      }
    }

    return fallback;
  }

  private getErrorStatus(error: unknown): number {
    return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
      ? error.status
      : 0;
  }

  // Máy chủ trả kèm tên trường gây lỗi (Full_name / Email / Phone_number) khi biết
  private getErrorField(error: unknown): FormField | null {
    if (typeof error === 'object' && error !== null && 'error' in error &&
        typeof error.error === 'object' && error.error !== null && 'field' in error.error) {
      const field = error.error.field;
      return FORM_FIELDS.find((name) => name === field) ?? null;
    }

    return null;
  }
}
