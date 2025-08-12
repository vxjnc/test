import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatIcon, MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIcon, MatIconModule],
    template: `
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center">
              <mat-icon class="h-8 w-8 text-primary-500">account_balance_wallet</mat-icon>
              <h1 class="ml-2 text-xl font-bold text-gray-900">GroupCache</h1>
            </div>
            
            <nav class="hidden md:ml-8 md:flex md:space-x-8">
              <a
                routerLink="/dashboard"
                routerLinkActive="text-primary-600 border-primary-600"
                class="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
              >
                <mat-icon name="home" class="mr-1 w-4 h-4"></mat-icon>
                Дашборд
              </a>
              <a
                routerLink="/groups"
                routerLinkActive="text-primary-600 border-primary-600"
                class="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
              >
                <mat-icon name="users" class="mr-1 w-4 h-4"></mat-icon>
                Группы
              </a>
              <a
                routerLink="/expenses"
                routerLinkActive="text-primary-600 border-primary-600"
                class="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
              >
                <mat-icon name="credit-card" class="mr-1 w-4 h-4"></mat-icon>
                Расходы
              </a>
            </nav>
          </div>

          <div class="flex items-center space-x-4">
            @if (authService.currentUser(); as user) {
              <div class="flex items-center text-sm text-gray-700">
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                  <span class="text-primary-600 font-medium">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                {{ user.name }}
              </div>
              <button
                (click)="authService.logout()"
                class="text-gray-500 hover:text-gray-700 p-2 rounded-md transition-colors"
                title="Выйти"
              >
                <mat-icon name="log-out" class="w-5 h-5"></mat-icon>
              </button>
            }
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
    public authService = inject(AuthService);
}