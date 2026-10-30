import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ReturnStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export interface ReturnTimelineItem {
  Step: string;
  Title: string;
  Description: string;
  Actor_id?: string;
  Actor_name?: string;
  Actor_role?: string;
  Status: string;
  Created_at: string | null;
}

export interface AdminReturnSummary {
  _id?: string;
  Return_order_id: string;
  Order_id: string;
  Product_variant_id: string;
  Customer_name: string;
  Product_name: string;
  Product_image: string;
  Variant_name: string;
  SKU: string;
  Return_quantity: number;
  Reason_type: string;
  Description?: string;
  Refund_amount: number;
  Status: ReturnStatus;
  Created_at: string;
  Handled_by?: string;
  Handled_by_name?: string;
  Handled_at?: string;
  Reject_reason?: string;
  Inspected_by?: string;
  Inspected_by_name?: string;
  Inspected_at?: string;
  Inspected_result?: string;
}

export interface AdminReturnDetail extends AdminReturnSummary {
  Customer: {
    Name: string;
    Phone: string;
    Email: string;
    Address: string;
  };
  Order_info: {
    Order_id: string;
    Created_at: string;
    Status: string;
    Total_amount: number;
    Total_items: number;
  };
  Product_info: {
    Product_id: string;
    Product_name: string;
    Product_image: string;
    Variant_id: string;
    Variant_name: string;
    SKU: string;
    Bought_quantity: number;
    Return_quantity: number;
    Price: number;
    Refund_amount: number;
  };
  Evidence_images: string[];
  Timeline: ReturnTimelineItem[];
}

export interface AdminReturnFilters {
  search?: string;
  status?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminReturnService {
  private readonly apiUrl = `${environment.apiUrl}/admin/returns`;

  constructor(private http: HttpClient) {}

  getReturns(filters: AdminReturnFilters): Observable<AdminApiResponse<AdminReturnSummary[]>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.withAuth((headers) =>
      this.http.get<AdminApiResponse<AdminReturnSummary[]>>(this.apiUrl, { headers, params })
    );
  }

  getReturnDetail(id: string): Observable<AdminApiResponse<AdminReturnDetail>> {
    return this.withAuth((headers) =>
      this.http.get<AdminApiResponse<AdminReturnDetail>>(`${this.apiUrl}/${id}`, { headers })
    );
  }

  approveReturn(id: string): Observable<AdminApiResponse<AdminReturnSummary>> {
    return this.withAuth((headers) =>
      this.http.post<AdminApiResponse<AdminReturnSummary>>(`${this.apiUrl}/${id}/approve`, {}, { headers })
    );
  }

  rejectReturn(id: string, rejectReason: string): Observable<AdminApiResponse<AdminReturnSummary>> {
    return this.withAuth((headers) =>
      this.http.post<AdminApiResponse<AdminReturnSummary>>(`${this.apiUrl}/${id}/reject`, { rejectReason }, { headers })
    );
  }

  acceptGoods(id: string): Observable<AdminApiResponse<AdminReturnSummary>> {
    return this.withAuth((headers) =>
      this.http.post<AdminApiResponse<AdminReturnSummary>>(`${this.apiUrl}/${id}/accept-goods`, {}, { headers })
    );
  }

  rejectGoods(id: string, rejectReason: string): Observable<AdminApiResponse<AdminReturnSummary>> {
    return this.withAuth((headers) =>
      this.http.post<AdminApiResponse<AdminReturnSummary>>(`${this.apiUrl}/${id}/reject-goods`, { rejectReason }, { headers })
    );
  }

  private withAuth<T>(request: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    const token = localStorage.getItem('vista_admin_token');
    if (!token) {
      return throwError(() => new Error('Vui lòng đăng nhập lại để tiếp tục.'));
    }

    return request(new HttpHeaders({ Authorization: `Bearer ${token}` }));
  }
}

