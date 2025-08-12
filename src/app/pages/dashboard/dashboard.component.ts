import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { GroupInDB, ExpenseInDB } from '../../models/api.models';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
    template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">
              Добро пожаловать, {{ authService.currentUser()?.name }}!
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Управляйте групповыми расходами легко и удобно
            </p>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-12">
              <app-loading-spinner />
            </div>
          } @else {
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <!-- Stats Cards -->
              <div class="card">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Всего групп</p>
                    <p class="text-2xl font-bold text-gray-900">{{ groups().length }}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Активных расходов</p>
                    <p class="text-2xl font-bold text-gray-900">{{ activeExpensesCount() }}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Общая сумма</p>
                    <p class="text-2xl font-bold text-gray-900">₽{{ totalAmount().toLocaleString() }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Recent Groups -->
              <div class="card">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-medium text-gray-900">Недавние группы</h2>
                  <a routerLink="/groups" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Показать все
                  </a>
                </div>
                @if (groups().length === 0) {
                  <div class="text-center py-6 text-gray-500">
                    <p>У вас пока нет групп</p>
                    <a routerLink="/groups" class="btn-primary mt-4 inline-flex">
                      Создать первую группу
                    </a>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (group of groups().slice(0, 3); track group.id) {
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h3 class="text-sm font-medium text-gray-900">{{ group.name }}</h3>
                        </div>
                        <a 
                          routerLink="/groups/{{ group.id }}" 
                          class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Открыть
                        </a>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Recent Expenses -->
              <div class="card">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-medium text-gray-900">Недавние расходы</h2>
                  <a routerLink="/expenses" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Показать все
                  </a>
                </div>
                @if (recentExpenses().length === 0) {
                  <div class="text-center py-6 text-gray-500">
                    <p>Расходов пока нет</p>
                  </div>
                } @else {
                  <div class="space-y-3">
                    @for (expense of recentExpenses(); track expense.id) {
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h3 class="text-sm font-medium text-gray-900">
                            {{ expense.description || 'Без описания' }}
                          </h3>
                          <p class="text-xs text-gray-500">{{ formatDate(expense.created_at) }}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-sm font-medium text-gray-900">₽{{ expense.amount.toLocaleString() }}</p>
                          @if (expense.is_settled) {
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Погашено
                            </span>
                          } @else {
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              Активно
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    loading = signal(false);
    groups = signal<GroupInDB[]>([]);
    allExpenses = signal<ExpenseInDB[]>([]);

    activeExpensesCount = signal(0);
    totalAmount = signal(0);
    recentExpenses = signal<ExpenseInDB[]>([]);

    public authService = inject(AuthService);
    private apiService = inject(ApiService);
    private toast = inject(ToastService);

    ngOnInit(): void {
        this.loadDashboardData();
    }

    private async loadDashboardData(): Promise<void> {
        this.loading.set(true);

        try {
            // Load groups
            const groups = await this.apiService.getGroups().toPromise();
            if (groups) {
                this.groups.set(groups);
            }

            // Load expenses for all groups
            let allExpenses: ExpenseInDB[] = [];
            for (const group of this.groups()) {
                try {
                    const expenses = await this.apiService.getExpenses(group.id).toPromise();
                    if (expenses) {
                        allExpenses = [...allExpenses, ...expenses];
                    }
                }
                catch (error) {
                    console.error(`Failed to load expenses for group ${group.id}:`, error);
                }
            }

            this.allExpenses.set(allExpenses);

            // Calculate stats
            const activeExpenses = allExpenses.filter(expense => !expense.is_settled);
            this.activeExpensesCount.set(activeExpenses.length);
            this.totalAmount.set(allExpenses.reduce((sum, expense) => sum + expense.amount, 0));

            // Get recent expenses (last 5)
            const sortedExpenses = allExpenses
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);
            this.recentExpenses.set(sortedExpenses);

        }
        catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.toast.error('Ошибка загрузки данных');
        }
        finally {
            this.loading.set(false);
        }
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}