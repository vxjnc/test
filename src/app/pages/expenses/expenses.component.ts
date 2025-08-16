import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { GroupInDB, ExpenseInDB, GroupMemberInDB, CategoryInDB } from '../../models/api.models';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Мои расходы</h1>
            <p class="mt-1 text-sm text-gray-500">
              Все расходы, в которых вы участвуете
            </p>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-12">
              <app-loading-spinner />
            </div>
          } @else {
            <!-- Filter buttons -->
            <div class="mb-6 flex flex-wrap gap-2">
              <button
                (click)="filterStatus = 'all'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                [class.bg-primary-500]="filterStatus === 'all'"
                [class.text-white]="filterStatus === 'all'"
                [class.bg-gray-200]="filterStatus !== 'all'"
                [class.text-gray-700]="filterStatus !== 'all'"
              >
                Все ({{ userExpenses().length }})
              </button>
              <button
                (click)="filterStatus = 'unpaid'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                [class.bg-red-500]="filterStatus === 'unpaid'"
                [class.text-white]="filterStatus === 'unpaid'"
                [class.bg-gray-200]="filterStatus !== 'unpaid'"
                [class.text-gray-700]="filterStatus !== 'unpaid'"
              >
                Неоплаченные ({{ unpaidExpenses().length }})
              </button>
              <button
                (click)="filterStatus = 'paid'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                [class.bg-green-500]="filterStatus === 'paid'"
                [class.text-white]="filterStatus === 'paid'"
                [class.bg-gray-200]="filterStatus !== 'paid'"
                [class.text-gray-700]="filterStatus !== 'paid'"
              >
                Оплаченные ({{ paidExpenses().length }})
              </button>
            </div>

            <!-- Summary cards -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
              <div class="card">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <mat-icon class="text-red-600">account_balance</mat-icon>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">К доплате</p>
                    <p class="text-2xl font-bold text-red-600">₽{{ totalUnpaidAmount().toLocaleString() }}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <mat-icon class="text-green-600">check_circle</mat-icon>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Оплачено</p>
                    <p class="text-2xl font-bold text-green-600">₽{{ totalPaidAmount().toLocaleString() }}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <mat-icon class="text-blue-600">receipt</mat-icon>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Всего расходов</p>
                    <p class="text-2xl font-bold text-blue-600">₽{{ totalAmount().toLocaleString() }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expenses list -->
            @if (filteredExpenses().length === 0) {
              <div class="text-center py-12">
                <mat-icon class="mx-auto text-gray-400 text-6xl">receipt</mat-icon>
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                  {{ filterStatus === 'all' ? 'Нет расходов' : 
                     filterStatus === 'unpaid' ? 'Нет неоплаченных расходов' : 'Нет оплаченных расходов' }}
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  {{ filterStatus === 'all' ? 'Расходы появятся здесь, когда вас добавят в группу' : 
                     filterStatus === 'unpaid' ? 'Все ваши расходы оплачены!' : 'У вас пока нет оплаченных расходов' }}
                </p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (expense of filteredExpenses(); track expense.id) {
                  <div class="card hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                          <h3 class="text-lg font-medium text-gray-900">
                            {{ expense.description || 'Без описания' }}
                          </h3>
                          <div class="text-right">
                            <p class="text-lg font-bold text-gray-900">₽{{ expense.amount.toLocaleString() }}</p>
                            @if (getUserShare(expense); as userShare) {
                              <p class="text-sm"
                                 [class.text-red-600]="!userShare.is_paid"
                                 [class.text-green-600]="userShare.is_paid">
                                Ваша доля: ₽{{ getUserShareAmount(expense).toLocaleString() }}
                              </p>
                            }
                          </div>
                        </div>
                        
                        <div class="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span class="flex items-center">
                            <mat-icon class="mr-1 text-xs">group</mat-icon>
                            {{ getGroupName(expense.group_id) }}
                          </span>
                          <span class="flex items-center">
                            <mat-icon class="mr-1 text-xs">calendar_today</mat-icon>
                            {{ formatDate(expense.created_at) }}
                          </span>
                          @if (expense.category_id) {
                            <span class="flex items-center px-2 py-1 rounded-full text-xs"
                                  [style.background-color]="getCategoryColor(expense.category_id) + '20'"
                                  [style.color]="getCategoryColor(expense.category_id)">
                              <mat-icon class="mr-1 text-xs">{{ getCategoryIcon(expense.category_id) }}</mat-icon>
                              {{ getCategoryName(expense.category_id) }}
                            </span>
                          }
                        </div>

                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-2">
                            @if (getUserShare(expense)?.is_paid) {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <mat-icon class="mr-1 text-xs">check_circle</mat-icon>
                                Оплачено
                              </span>
                            } @else {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                <mat-icon class="mr-1 text-xs">schedule</mat-icon>
                                К доплате
                              </span>
                            }
                            
                            @if (expense.is_settled) {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                <mat-icon class="mr-1 text-xs">done_all</mat-icon>
                                Расход закрыт
                              </span>
                            }
                          </div>
                          
                          <a 
                            routerLink="/groups/{{ expense.group_id }}" 
                            class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                          >
                            Открыть группу
                            <mat-icon class="ml-1 text-sm">chevron_right</mat-icon>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class ExpensesComponent implements OnInit {
  loading = signal(false);
  groups = signal<GroupInDB[]>([]);
  allExpenses = signal<ExpenseInDB[]>([]);
  allMembers = signal<Map<string, GroupMemberInDB[]>>(new Map());
  allCategories = signal<Map<string, CategoryInDB[]>>(new Map());
  
  filterStatus: 'all' | 'paid' | 'unpaid' = 'all';

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toast = inject(ToastService);

  // Computed properties
  userExpenses = computed(() => {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return [];

    return this.allExpenses().filter(expense => {
      const groupMembers = this.allMembers().get(expense.group_id) || [];
      const userMember = groupMembers.find(m => m.user_id === currentUserId);
      return userMember && expense.shares.some(share => share.member_id === userMember.id);
    });
  });

  paidExpenses = computed(() => {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return [];

    return this.userExpenses().filter(expense => {
      const groupMembers = this.allMembers().get(expense.group_id) || [];
      const userMember = groupMembers.find(m => m.user_id === currentUserId);
      if (!userMember) return false;
      
      const userShare = expense.shares.find(share => share.member_id === userMember.id);
      return userShare?.is_paid || false;
    });
  });

  unpaidExpenses = computed(() => {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return [];

    return this.userExpenses().filter(expense => {
      const groupMembers = this.allMembers().get(expense.group_id) || [];
      const userMember = groupMembers.find(m => m.user_id === currentUserId);
      if (!userMember) return false;
      
      const userShare = expense.shares.find(share => share.member_id === userMember.id);
      return !userShare?.is_paid;
    });
  });

  filteredExpenses = computed(() => {
    switch (this.filterStatus) {
      case 'paid':
        return this.paidExpenses();
      case 'unpaid':
        return this.unpaidExpenses();
      default:
        return this.userExpenses();
    }
  });

  totalAmount = computed(() => {
    return this.userExpenses().reduce((sum, expense) => {
      return sum + this.getUserShareAmount(expense);
    }, 0);
  });

  totalPaidAmount = computed(() => {
    return this.paidExpenses().reduce((sum, expense) => {
      return sum + this.getUserShareAmount(expense);
    }, 0);
  });

  totalUnpaidAmount = computed(() => {
    return this.unpaidExpenses().reduce((sum, expense) => {
      return sum + this.getUserShareAmount(expense);
    }, 0);
  });

  ngOnInit(): void {
    this.loadExpensesData();
  }

  private async loadExpensesData(): Promise<void> {
    this.loading.set(true);

    try {
      // Load groups
      const groups = await this.apiService.getGroups().toPromise();
      if (groups) {
        this.groups.set(groups);
      }

      // Load expenses, members, and categories for all groups
      let allExpenses: ExpenseInDB[] = [];
      const membersMap = new Map<string, GroupMemberInDB[]>();
      const categoriesMap = new Map<string, CategoryInDB[]>();
      
      for (const group of this.groups()) {
        try {
          const [expenses, members, categories] = await Promise.all([
            this.apiService.getExpenses(group.id).toPromise(),
            this.apiService.getGroupMembers(group.id).toPromise(),
            this.apiService.getGroupCategories(group.id).toPromise()
          ]);
          
          if (expenses) {
            allExpenses = [...allExpenses, ...expenses];
          }
          if (members) {
            membersMap.set(group.id, members);
          }
          if (categories) {
            categoriesMap.set(group.id, categories);
          }
        } catch (error) {
          console.error(`Failed to load data for group ${group.id}:`, error);
        }
      }

      this.allExpenses.set(allExpenses);
      this.allMembers.set(membersMap);
      this.allCategories.set(categoriesMap);

    } catch (error) {
      console.error('Failed to load expenses data:', error);
      this.toast.error('Ошибка загрузки данных');
    } finally {
      this.loading.set(false);
    }
  }

  getUserShare(expense: ExpenseInDB): { member_id: number; share?: number | null; is_paid: boolean } | undefined {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return undefined;

    const groupMembers = this.allMembers().get(expense.group_id) || [];
    const userMember = groupMembers.find(m => m.user_id === currentUserId);
    if (!userMember) return undefined;

    return expense.shares.find(share => share.member_id === userMember.id);
  }

  getUserShareAmount(expense: ExpenseInDB): number {
    const userShare = this.getUserShare(expense);
    if (!userShare) return 0;

    if (userShare.share && userShare.share > 0) {
      return userShare.share;
    }

    // Equal split calculation
    const totalCustomShares = expense.shares.reduce((sum, share) => sum + (share.share || 0), 0);
    const remainingAmount = expense.amount - totalCustomShares;
    const sharesWithoutCustomAmount = expense.shares.filter(s => !s.share || s.share === 0).length;
    
    return sharesWithoutCustomAmount > 0 ? remainingAmount / sharesWithoutCustomAmount : 0;
  }

  getGroupName(groupId: string): string {
    const group = this.groups().find(g => g.id === groupId);
    return group?.name || 'Неизвестная группа';
  }

  getCategoryName(categoryId: number): string {
    for (const categories of this.allCategories().values()) {
      const category = categories.find(c => c.id === categoryId);
      if (category) return category.name;
    }
    return 'Неизвестная категория';
  }

  getCategoryIcon(categoryId: number): string {
    for (const categories of this.allCategories().values()) {
      const category = categories.find(c => c.id === categoryId);
      if (category) return category.icon;
    }
    return 'receipt';
  }

  getCategoryColor(categoryId: number): string {
    for (const categories of this.allCategories().values()) {
      const category = categories.find(c => c.id === categoryId);
      if (category) return category.color;
    }
    return '#cccccc';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}