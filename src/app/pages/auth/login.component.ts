import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, MatIconModule],
    template: `
   <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="mx-auto h-12 w-12 text-primary-500 flex items-center justify-center">
          <mat-icon>account_balance_wallet</mat-icon>
        </div>
        <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
          Войдите в GroupCache
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Или
          <a routerLink="/auth/register" class="font-medium text-primary-600 hover:text-primary-500">
            создайте новый аккаунт
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="email" class="form-label">Email адрес</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.border-red-500]="loginForm.get('email')?.touched && loginForm.get('email')?.errors"
              />
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.errors) {
                <p class="mt-1 text-sm text-red-600">Введите корректный email</p>
              }
            </div>

            <div>
              <label for="password" class="form-label">Пароль</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="form-input"
                [class.border-red-500]="loginForm.get('password')?.touched && loginForm.get('password')?.errors"
              />
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.errors) {
                <p class="mt-1 text-sm text-red-600">Введите пароль</p>
              }
            </div>

            <div>
              <button
                type="submit"
                [disabled]="!loginForm.valid || loading()"
                class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (loading()) {
                  <app-loading-spinner />
                } @else {
                  Войти
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
    loginForm: FormGroup;
    loading = signal(false);

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private toast = inject(ToastService);

    constructor(
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]]
        });
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.loading.set(true);
            const { email, password } = this.loginForm.value;

            this.authService.login(email, password).subscribe({
                next: () => {
                    this.toast.success('Добро пожаловать!');
                    this.router.navigate(['/dashboard']);
                },
                error: (error) => {
                    this.toast.error(error.message || 'Ошибка входа');
                    this.loading.set(false);
                },
                complete: () => {
                    this.loading.set(false);
                }
            });
        }
    }
}