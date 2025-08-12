import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Token, UserInDB } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<UserInDB | null>(null);
    private loadingSubject = new BehaviorSubject<boolean>(false);

    // Signals for reactive state management
    currentUser = signal<UserInDB | null>(null);
    loading = signal<boolean>(false);
    isAuthenticated = computed(() => !!this.currentUser());

    // Observable streams for components that prefer RxJS
    currentUser$ = this.currentUserSubject.asObservable();
    loading$ = this.loadingSubject.asObservable();

    private apiService = inject(ApiService);
    private router = inject(Router);

    constructor(
    ) {
        this.initializeAuth();
    }

    private async initializeAuth(): Promise<void> {
        const token = localStorage.getItem('access_token');
        if (token) {
            this.loading.set(true);
            this.loadingSubject.next(true);

            try {
                const user = await this.apiService.getCurrentUser().toPromise();
                if (user) {
                    this.setCurrentUser(user);
                }
            }
            catch (error) {
                console.error('Failed to load user:', error);
                this.clearAuth();
            }
            finally {
                this.loading.set(false);
                this.loadingSubject.next(false);
            }
        }
    }

    private setCurrentUser(user: UserInDB): void {
        this.currentUser.set(user);
        this.currentUserSubject.next(user);
    }

    private clearAuth(): void {
        localStorage.removeItem('access_token');
        this.currentUser.set(null);
        this.currentUserSubject.next(null);
    }

    login(email: string, password: string): Observable<Token> {
        this.loading.set(true);
        this.loadingSubject.next(true);

        return this.apiService.login({ username: email, password }).pipe(
            tap(async (tokenData) => {
                localStorage.setItem('access_token', tokenData.access_token);
                try {
                    const user = await this.apiService.getCurrentUser().toPromise();
                    if (user) {
                        this.setCurrentUser(user);
                    }
                }
                catch (error) {
                    console.error('Failed to load user after login:', error);
                    this.clearAuth();
                    throw error;
                }
            }),
            tap(() => {
                this.loading.set(false);
                this.loadingSubject.next(false);
            }),
            catchError((error) => {
                this.loading.set(false);
                this.loadingSubject.next(false);
                throw error;
            }),
            tap(() => true)
        );
    }

    register(name: string, email: string, password: string): Observable<UserInDB> {
        this.loading.set(true);
        this.loadingSubject.next(true);

        return this.apiService.register({ name, email, password }).pipe(
            tap(async () => {
                // After registration, automatically log in
                try {
                    const loginResult = await this.login(email, password).toPromise();
                    return loginResult;
                }
                catch (error) {
                    this.loading.set(false);
                    this.loadingSubject.next(false);
                    throw error;
                }
            }),
            catchError((error) => {
                this.loading.set(false);
                this.loadingSubject.next(false);
                throw error;
            }),
            tap(() => true)
        );
    }

    logout(): void {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }
}