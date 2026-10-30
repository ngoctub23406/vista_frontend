import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ReviewDisplayStatus = 'pending' | 'approved' | 'replied' | 'rejected';

export type ReviewAction = 'approve' | 'reject' | 'suggest_reply' | 'save_draft' | 'send_reply';

export interface AdminReviewSummary {
  Review_id: string;
  Customer_name: string;
  Product_name: string;
  Variant_name: string;
  Product_variant_id: string;
  Image: string;
  Rating: number;
  Comment: string;
  Image_count: number;
  Created_at: string;
  Display_status: ReviewDisplayStatus;
  /** Staff đã lưu bản nháp phản hồi nhưng chưa gửi */
  Has_draft: boolean;
  Replied_at: string | null;
}

export interface ReviewHistoryItem {
  Event: string;
  Actor_id: string;
  Actor_name: string;
  Note: string;
  Created_at: string | null;
}

export interface AdminReviewDetail {
  Review_id: string;
  Created_at: string;
  Rating: number;
  Comment: string;
  Images: string[];
  Display_status: ReviewDisplayStatus;
  Available_actions: ReviewAction[];

  Customer_name: string;
  Customer_phone: string;
  Customer_email: string;
  Order_id: string;
  Is_verified_purchase: boolean;

  Product_id: string;
  Product_name: string;
  Variant_name: string;
  Product_variant_id: string;
  Image: string;

  Moderated_by_name: string;
  Moderated_at: string | null;
  Moderation_note: string;

  AI_reply_draft: string;
  Reply_draft: string;
  Reply_draft_version: number;
  Reply_draft_by_name: string;
  Reply_draft_at: string | null;
  Reply_reviewed: boolean;
  Reply_content: string;
  Replied_by_name: string;
  Replied_at: string | null;

  History: ReviewHistoryItem[];
}

export interface AdminReviewFilters {
  keyword?: string;
  status?: string;
  rating?: number | string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminReviewListData {
  items: AdminReviewSummary[];
  total: number;
  page: number;
  limit: number;
  /** Số đánh giá theo từng nhãn: all, pending, approved, replied, rejected, drafts */
  counts: Record<string, number>;
}

export interface AdminReviewApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class AdminReviewService {
  private readonly apiUrl = `${environment.apiUrl}/admin/reviews`;

  constructor(private http: HttpClient) {}

  getReviews(filters: AdminReviewFilters): Observable<AdminReviewApiResponse<AdminReviewListData>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.withAuth((headers) =>
      this.http.get<AdminReviewApiResponse<AdminReviewListData>>(this.apiUrl, { headers, params }),
    );
  }

  getReviewDetail(reviewId: string): Observable<AdminReviewApiResponse<AdminReviewDetail>> {
    return this.withAuth((headers) =>
      this.http.get<AdminReviewApiResponse<AdminReviewDetail>>(`${this.apiUrl}/${encodeURIComponent(reviewId)}`, { headers }),
    );
  }

  moderate(reviewId: string, decision: 'approve' | 'reject', note = ''): Observable<AdminReviewApiResponse> {
    return this.withAuth((headers) =>
      this.http.patch<AdminReviewApiResponse>(
        `${this.apiUrl}/${encodeURIComponent(reviewId)}/moderate`,
        { decision, note },
        { headers },
      ),
    );
  }

  suggestReply(reviewId: string): Observable<AdminReviewApiResponse<{ AI_reply_draft: string }>> {
    return this.withAuth((headers) =>
      this.http.post<AdminReviewApiResponse<{ AI_reply_draft: string }>>(
        `${this.apiUrl}/${encodeURIComponent(reviewId)}/suggest-reply`,
        {},
        { headers },
      ),
    );
  }

  saveDraft(reviewId: string, content: string): Observable<AdminReviewApiResponse<{ Reply_draft_version: number }>> {
    return this.withAuth((headers) =>
      this.http.put<AdminReviewApiResponse<{ Reply_draft_version: number }>>(
        `${this.apiUrl}/${encodeURIComponent(reviewId)}/draft`,
        { content },
        { headers },
      ),
    );
  }

  sendReply(reviewId: string, version: number): Observable<AdminReviewApiResponse> {
    return this.withAuth((headers) =>
      this.http.post<AdminReviewApiResponse>(
        `${this.apiUrl}/${encodeURIComponent(reviewId)}/send`,
        { version },
        { headers },
      ),
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
