import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
    UserInDB, UserCreate, UserUpdate, Token,
    GroupInDB, GroupCreate, GroupUpdate,
    GroupMemberInDB, GroupMemberCreate,
    ExpenseInDB, ExpenseCreate, ExpenseUpdate, ExpenseShareUpdate,
    CategoryInDB, CategoryCreate,
    SubscriptionInDB, SubscriptionCreate
} from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly API_BASE = 'http://localhost:8100';

    private http = inject(HttpClient);

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('access_token');
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    private handleError(error: any): Observable<never> {
        console.error('API Error:', error);
        const apiError = error.error?.detail || 'Network error';
        return throwError(() => new Error(apiError));
    }

    // Auth endpoints
    register(userData: UserCreate): Observable<UserInDB> {
        return this.http.post<UserInDB>(`${this.API_BASE}/api/register`, userData)
            .pipe(catchError(this.handleError));
    }

    login(credentials: { username: string; password: string }): Observable<Token> {
        const formData = new URLSearchParams();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);
        formData.append('grant_type', 'password');

        return this.http.post<Token>(`${this.API_BASE}/api/token`, formData, {
            headers: new HttpHeaders({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
        }).pipe(catchError(this.handleError));
    }

    getCurrentUser(): Observable<UserInDB> {
        return this.http.get<UserInDB>(`${this.API_BASE}/api/me`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    // User endpoints
    getUser(userId: string): Observable<UserInDB> {
        return this.http.get<UserInDB>(`${this.API_BASE}/api/users/${userId}`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    updateUser(userId: string, userData: UserUpdate): Observable<UserInDB> {
        return this.http.put<UserInDB>(`${this.API_BASE}/api/users/${userId}`, userData, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    // Group endpoints
    getGroups(): Observable<GroupInDB[]> {
        return this.http.get<GroupInDB[]>(`${this.API_BASE}/api/groups/`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    createGroup(groupData: GroupCreate): Observable<GroupInDB> {
        return this.http.post<GroupInDB>(`${this.API_BASE}/api/groups/`, groupData, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    getGroup(groupId: string): Observable<GroupInDB> {
        return this.http.get<GroupInDB>(`${this.API_BASE}/api/groups/${groupId}`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    updateGroup(groupId: string, groupData: GroupUpdate): Observable<GroupInDB> {
        return this.http.put<GroupInDB>(`${this.API_BASE}/api/groups/${groupId}`, groupData, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    // Group member endpoints
    getGroupMembers(groupId: string): Observable<GroupMemberInDB[]> {
        return this.http.get<GroupMemberInDB[]>(`${this.API_BASE}/api/groups/${groupId}/members/`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    addGroupMember(groupId: string, memberData: GroupMemberCreate): Observable<GroupMemberInDB> {
        return this.http.post<GroupMemberInDB>(`${this.API_BASE}/api/groups/${groupId}/members/`, memberData, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    removeGroupMember(groupId: string, memberId: number): Observable<void> {
        return this.http.delete<void>(`${this.API_BASE}/api/groups/${groupId}/members/${memberId}`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    // Expense endpoints
    getExpenses(groupId: string): Observable<ExpenseInDB[]> {
        return this.http.get<ExpenseInDB[]>(`${this.API_BASE}/api/groups/${groupId}/expenses/`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    createExpense(groupId: string, expenseData: ExpenseCreate): Observable<ExpenseInDB> {
        return this.http.post<ExpenseInDB>(`${this.API_BASE}/api/groups/${groupId}/expenses/`, expenseData, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    updateExpense(groupId: string, expenseId: string, expenseData: ExpenseUpdate): Observable<ExpenseInDB> {
        return this.http.put<ExpenseInDB>(
            `${this.API_BASE}/api/groups/${groupId}/expenses/${expenseId}`,
            expenseData,
            { headers: this.getHeaders() }
        ).pipe(catchError(this.handleError));
    }

    updateExpenseShare(
        groupId: string,
        expenseId: string,
        memberId: number,
        shareData: ExpenseShareUpdate
    ): Observable<ExpenseInDB> {
        return this.http.patch<ExpenseInDB>(
            `${this.API_BASE}/api/groups/${groupId}/expenses/${expenseId}/shares/${memberId}`,
            shareData,
            { headers: this.getHeaders() }
        ).pipe(catchError(this.handleError));
    }

    // Category endpoints
    getGroupCategories(groupId: string): Observable<CategoryInDB[]> {
        return this.http.get<CategoryInDB[]>(`${this.API_BASE}/api/groups/${groupId}/categories/`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }

    createCategory(groupId: string, categoryData: CategoryCreate): Observable<CategoryInDB> {
        return this.http.post<CategoryInDB>(
            `${this.API_BASE}/api/groups/${groupId}/categories/`,
            categoryData,
            { headers: this.getHeaders() }
        ).pipe(catchError(this.handleError));
    }

    // Subscription endpoints
    createSubscription(subscriptionData: SubscriptionCreate): Observable<SubscriptionInDB> {
        return this.http.post<SubscriptionInDB>(`${this.API_BASE}/api/subscriptions/`, subscriptionData, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError));
    }
}