import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="mx-auto h-12 w-12 text-primary-500 flex items-center justify-center">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
          </svg>
        </div>
        <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
          Создать аккаунт
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Или
          <a routerLink="/auth/login" class="font-medium text-primary-600 hover:text-primary-500">
            войдите в существующий аккаунт
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="name" class="form-label">Имя</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="form-input"
                [class.border-red-500]="registerForm.get('name')?.touched && registerForm.get('name')?.errors"
              />
              @if (registerForm.get('name')?.touched && registerForm.get('name')?.errors) {
                <p class="mt-1 text-sm text-red-600">Введите ваше имя</p>
              }
            </div>

            <div>
              <label for="email" class="form-label">Email адрес</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.border-red-500]="registerForm.get('email')?.touched && registerForm.get('email')?.errors"
              />
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.errors) {
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
                [class.border-red-500]="registerForm.get('password')?.touched && registerForm.get('password')?.errors"
              />
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.errors) {
                <div class="mt-1 text-sm text-red-600">
                  @if (registerForm.get('password')?.errors?.['required']) {
                    <p>Введите пароль</p>
                  }
                  @if (registerForm.get('password')?.errors?.['minlength']) {
                    <p>Пароль должен содержать минимум 8 символов</p>
                  }
                </div>
              }
            </div>

            <div>
              <button
                type="submit"
                [disabled]="!registerForm.valid || loading()"
                class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (loading()) {
                  <app-loading-spinner />
                } @else {
                  Создать аккаунт
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
    registerForm: FormGroup;
    loading = signal(false);

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private toast = inject(ToastService);

    constructor(
    ) {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]]
        });
    }

    onSubmit(): void {
        if (this.registerForm.valid) {
            this.loading.set(true);
            const { name, email, password } = this.registerForm.value;

            this.authService.register(name, email, password).subscribe({
                next: () => {
                    this.toast.success('Аккаунт успешно создан!');
                    this.router.navigate(['/dashboard']);
                },
                error: (error) => {
                    this.toast.error(error.message || 'Ошибка регистрации');
                    this.loading.set(false);
                },
                complete: () => {
                    this.loading.set(false);
                }
            });
        }
    }
}