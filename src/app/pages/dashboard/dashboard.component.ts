import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { GroupInDB, ExpenseInDB } from '../../models/api.models';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, LoadingSpinnerComponent, MatIconModule],
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
                      <mat-icon class="text-primary-600">group</mat-icon>
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
                      <mat-icon class="text-secondary-600">receipt</mat-icon>
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
                      <mat-icon class="text-accent-600">attach_money</mat-icon>
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