import { Component, computed, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';
import {
  GroupInDB, ExpenseInDB, GroupMemberInDB,
  CategoryInDB, ExpenseCreate, GroupMemberCreate,
  CategoryCreate, ExpenseUpdate, ExpenseShareInput
} from '../../models/api.models';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ group()?.name }}</h1>
              <p class="mt-1 text-sm text-gray-500">ID: {{ groupId }}</p>
            </div>
            
            <div class="flex space-x-2">
              <button
                (click)="showMemberModal = true"
                class="btn-primary"
              >
                <mat-icon class="mr-2">add</mat-icon>
                Добавить участника
              </button>

              <button
                (click)="showCategoryModal = true"
                class="btn-secondary"
              >
                <mat-icon class="mr-2">category</mat-icon>
                Добавить категорию
              </button>
            </div>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-12">
              <app-loading-spinner />
            </div>
          } @else {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Участники группы -->
              <div class="card lg:col-span-1">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Участники</h2>
                <div class="space-y-3">
                  @for (member of members(); track member.id) {
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h3 class="text-sm font-medium text-gray-900">
                          {{ member.name || 'Без имени' }}
                        </h3>
                        <p class="text-xs text-gray-500">
                          {{ member.is_admin ? 'Администратор' : 'Участник' }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-medium"
                           [class.text-red-600]="getMemberDebt(member.id) > 0"
                           [class.text-green-600]="getMemberDebt(member.id) < 0"
                           [class.text-gray-600]="getMemberDebt(member.id) === 0">
                          {{ getMemberDebt(member.id) | number:'1.2-2' }} ₽
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ getMemberDebt(member.id) > 0 ? 'Долг' : getMemberDebt(member.id) < 0 ? 'Переплата' : 'Нет долга' }}
                        </p>
                      </div>
                      <button
                        (click)="removeMember(member.id, $event)"
                        class="text-red-500 hover:text-red-700 ml-2"
                        title="Удалить"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Расходы группы -->
              <div class="card lg:col-span-2">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-medium text-gray-900">Расходы</h2>
                  <button
                    (click)="showExpenseModal = true; initExpenseForm()"
                    class="btn-primary"
                  >
                    <mat-icon class="mr-2">add</mat-icon>
                    Добавить расход
                  </button>
                </div>
                <div class="space-y-3 max-h-96 overflow-y-auto">
                  @if (expenses().length === 0) {
                    <div class="text-center py-6 text-gray-500">
                      <p>Расходов пока нет</p>
                    </div>
                  } @else {
                    @for (expense of expenses(); track expense.id) {
                      <div class="bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                           (click)="editExpense(expense)">
                        <div class="flex items-center justify-between p-3">
                          <div>
                            <h3 class="text-sm font-medium text-gray-900">
                              {{ expense.description || 'Без описания' }}
                            </h3>
                            <p class="text-xs text-gray-500">
                              {{ formatDate(expense.created_at) }}
                              @if (expense.category_id) {
                                <span class="ml-2 px-2 py-1 rounded-full text-xs"
                                      [style.background-color]="getCategoryColor(expense.category_id)"
                                      [style.color]="getContrastColor(getCategoryColor(expense.category_id))">
                                  <mat-icon class="text-xs mr-1">{{ getCategoryIcon(expense.category_id) }}</mat-icon>
                                  {{ getCategoryName(expense.category_id) }}
                                </span>
                              }
                            </p>
                          </div>
                          <div class="text-right">
                            <p class="text-sm font-medium text-gray-900">₽{{ expense.amount.toLocaleString() }}</p>
                            @if (expense.is_settled) {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <mat-icon class="mr-1 text-xs">check_circle</mat-icon>
                                Погашено
                              </span>
                            } @else {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                <mat-icon class="mr-1 text-xs">schedule</mat-icon>
                                Активно
                              </span>
                            }
                          </div>
                        </div>
                        
                        <!-- Детали долей -->
                        <div class="border-t border-gray-200 p-3">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            @for (share of expense.shares; track share.member_id) {
                              <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                  <span class="text-sm text-gray-700">
                                    {{ getMemberName(share.member_id) }}
                                  </span>
                                  @if (share.share) {
                                    <span class="ml-2 text-xs text-gray-500">
                                      (₽{{ share.share.toLocaleString() }})
                                    </span>
                                  }
                                </div>
                                <div>
                                  @if (share.is_paid) {
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                      <mat-icon class="mr-1 text-xs">check</mat-icon>
                                      Оплачено
                                    </span>
                                  } @else {
                                    <button
                                      (click)="toggleSharePayment(expense.id, share.member_id, !share.is_paid, $event)"
                                      class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                                    >
                                      <mat-icon class="mr-1 text-xs">schedule</mat-icon>
                                      Отметить оплату
                                    </button>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
            
            <!-- Графики расходов -->
            <div class="card mt-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">Аналитика расходов</h2>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Расходы по категориям</h3>
                  <div class="h-64">
                    <canvas #categoryChart></canvas>
                  </div>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">Расходы по времени</h3>
                  <div class="h-64">
                    <canvas #timeChart></canvas>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Категории группы -->
            <div class="mt-8">
              <h2 class="text-lg font-medium text-gray-900 mb-4">Категории</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                @for (category of categories(); track category.id) {
                  <div class="card p-4 flex items-center justify-center flex-col text-center"
                       [style.background-color]="category.color + '20'">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                         [style.background-color]="category.color">
                      <mat-icon class="text-white text-sm">{{ category.icon }}</mat-icon>
                    </div>
                    <span class="text-sm font-medium">{{ category.name }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Модальное окно добавления участника -->
          @if (showMemberModal) {
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Добавить участника</h3>
                  <form [formGroup]="memberForm" (ngSubmit)="addMember()">
                    <div class="mb-4">
                      <label for="memberName" class="form-label">Имя участника</label>
                      <input
                        id="memberName"
                        type="text"
                        formControlName="name"
                        class="form-input"
                        placeholder="Введите имя"
                      />
                      @if (memberForm.get('name')?.touched && memberForm.get('name')?.errors) {
                        <p class="mt-1 text-sm text-red-600">Введите имя участника</p>
                      }
                    </div>
                    <div class="mb-4 flex items-center">
                      <input
                        id="isAdmin"
                        type="checkbox"
                        formControlName="is_admin"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label for="isAdmin" class="ml-2 block text-sm text-gray-700">
                        Администратор группы
                      </label>
                    </div>
                    <div class="flex justify-end space-x-3">
                      <button
                        type="button"
                        (click)="closeMemberModal()"
                        class="btn-outline"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        [disabled]="!memberForm.valid || submittingMember()"
                        class="btn-primary disabled:opacity-50"
                      >
                        @if (submittingMember()) {
                          <app-loading-spinner />
                        } @else {
                          Добавить
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          }

          <!-- Модальное окно добавления категории -->
          @if (showCategoryModal) {
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Добавить категорию</h3>
                  <form [formGroup]="categoryForm" (ngSubmit)="addCategory()">
                    <div class="mb-4">
                      <label for="categoryName" class="form-label">Название категории</label>
                      <input
                        id="categoryName"
                        type="text"
                        formControlName="name"
                        class="form-input"
                        placeholder="Введите название"
                      />
                      @if (categoryForm.get('name')?.touched && categoryForm.get('name')?.errors) {
                        <p class="mt-1 text-sm text-red-600">Введите название категории</p>
                      }
                    </div>
                    <div class="mb-4">
                      <label for="categoryIcon" class="form-label">Иконка</label>
                      <select
                        id="categoryIcon"
                        formControlName="icon"
                        class="form-input"
                      >
                        <option value="receipt">receipt - Чек</option>
                        <option value="restaurant">restaurant - Еда</option>
                        <option value="local_gas_station">local_gas_station - Топливо</option>
                        <option value="shopping_cart">shopping_cart - Покупки</option>
                        <option value="home">home - Дом</option>
                        <option value="medical_services">medical_services - Медицина</option>
                        <option value="school">school - Образование</option>
                        <option value="sports_esports">sports_esports - Развлечения</option>
                        <option value="directions_car">directions_car - Транспорт</option>
                        <option value="phone">phone - Связь</option>
                      </select>
                    </div>
                    <div class="mb-4">
                      <label for="categoryColor" class="form-label">Цвет</label>
                      <div class="flex space-x-2 mb-2">
                        @for (color of predefinedColors; track color) {
                          <button
                            type="button"
                            (click)="categoryForm.patchValue({color: color})"
                            class="w-8 h-8 rounded-full border-2"
                            [style.background-color]="color"
                            [class.border-gray-800]="categoryForm.value.color === color"
                            [class.border-gray-300]="categoryForm.value.color !== color"
                          ></button>
                        }
                      </div>
                      <input
                        id="categoryColor"
                        type="color"
                        formControlName="color"
                        class="form-input h-10"
                      />
                    </div>
                    <div class="flex justify-end space-x-3">
                      <button
                        type="button"
                        (click)="closeCategoryModal()"
                        class="btn-outline"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        [disabled]="!categoryForm.valid || submittingCategory()"
                        class="btn-primary disabled:opacity-50"
                      >
                        @if (submittingCategory()) {
                          <app-loading-spinner />
                        } @else {
                          Добавить
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          }

          <!-- Модальное окно добавления/редактирования расхода -->
          @if (showExpenseModal) {
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div class="mt-3">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    {{ editingExpense ? 'Редактировать расход' : 'Добавить расход' }}
                  </h3>
                  <form [formGroup]="expenseForm" (ngSubmit)="editingExpense ? updateExpense() : addExpense()">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label for="expenseAmount" class="form-label">Сумма (₽)</label>
                        <input
                          id="expenseAmount"
                          type="number"
                          step="0.01"
                          formControlName="amount"
                          class="form-input"
                          placeholder="0.00"
                        />
                        @if (expenseForm.get('amount')?.touched && expenseForm.get('amount')?.errors) {
                          <p class="mt-1 text-sm text-red-600">Введите корректную сумму</p>
                        }
                      </div>

                      <div>
                        <label for="expenseDate" class="form-label">Дата расхода</label>
                        <input
                          id="expenseDate"
                          type="date"
                          formControlName="created_at"
                          class="form-input"
                        />
                        @if (expenseForm.get('created_at')?.touched && expenseForm.get('created_at')?.errors) {
                          <p class="mt-1 text-sm text-red-600">Выберите дату</p>
                        }
                      </div>
                    </div>

                    <div class="mb-4">
                      <label for="expenseDescription" class="form-label">Описание</label>
                      <input
                        id="expenseDescription"
                        type="text"
                        formControlName="description"
                        class="form-input"
                        placeholder="На что потрачено?"
                      />
                    </div>

                    <div class="mb-4">
                      <label for="expenseCategory" class="form-label">Категория</label>
                      <select
                        id="expenseCategory"
                        formControlName="category_id"
                        class="form-input"
                      >
                        <option value="">Без категории</option>
                        @for (category of categories(); track category.id) {
                          <option [value]="category.id">{{ category.name }}</option>
                        }
                      </select>
                    </div>

                    <div class="mb-4">
                      <label class="form-label">Участники и доли</label>
                      <div class="space-y-3 max-h-60 overflow-y-auto">
                        @for (member of members(); track member.id; let i = $index) {
                          <div class="card p-3">
                            <div class="flex items-center mb-2">
                              <input
                                type="checkbox"
                                [id]="'shareCheckbox'+i"
                                [formControl]="getShareControl(i, 'is_included')"
                                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <label [for]="'shareCheckbox'+i" class="ml-2 block text-sm text-gray-700 font-medium">
                                {{ member.name || 'Без имени' }}
                              </label>
                            </div>
                            
                            @if (getShareControl(i, 'is_included').value) {
                              <div class="ml-6 space-y-2">
                                <div>
                                  <label [for]="'shareAmount'+i" class="block text-sm text-gray-500 mb-1">
                                    Доля (₽) - оставьте пустым для равного деления
                                  </label>
                                  <input
                                    [id]="'shareAmount'+i"
                                    type="number"
                                    step="0.01"
                                    [formControl]="getShareControl(i, 'share')"
                                    class="form-input w-full"
                                    placeholder="Автоматически"
                                  />
                                </div>
                                
                                <div class="flex items-center">
                                  <input
                                    [id]="'isPaid'+i"
                                    type="checkbox"
                                    [formControl]="getShareControl(i, 'is_paid')"
                                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <label [for]="'isPaid'+i" class="ml-2 block text-sm text-gray-500">
                                    Уже оплачено
                                  </label>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                      @if (expenseForm.get('shares')?.touched && expenseForm.get('shares')?.errors) {
                        <p class="mt-1 text-sm text-red-600">Выберите хотя бы одного участника</p>
                      }
                    </div>

                    <div class="flex justify-end space-x-3">
                      <button
                        type="button"
                        (click)="closeExpenseModal()"
                        class="btn-outline"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        [disabled]="!expenseForm.valid || submittingExpense()"
                        class="btn-primary disabled:opacity-50"
                      >
                        @if (submittingExpense()) {
                          <app-loading-spinner />
                        } @else {
                          {{ editingExpense ? 'Сохранить' : 'Добавить' }}
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class GroupDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('timeChart', { static: false }) timeChartRef!: ElementRef<HTMLCanvasElement>;

  private categoryChart: Chart | null = null;
  private timeChart: Chart | null = null;

  loading = signal(true);
  groupId: string | null = null;
  group = signal<GroupInDB | null>(null);
  members = signal<GroupMemberInDB[]>([]);
  expenses = signal<ExpenseInDB[]>([]);
  categories = signal<CategoryInDB[]>([]);

  showMemberModal = false;
  showCategoryModal = false;
  showExpenseModal = false;
  submittingMember = signal(false);
  submittingCategory = signal(false);
  submittingExpense = signal(false);
  editingExpense: ExpenseInDB | null = null;

  memberForm: FormGroup;
  categoryForm: FormGroup;
  expenseForm: FormGroup;

  predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  constructor() {
    // Форма для добавления участника
    this.memberForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      is_admin: [false]
    });

    // Форма для добавления категории
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      icon: ['receipt'],
      color: ['#3B82F6']
    });

    // Форма для добавления расхода
    this.expenseForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.maxLength(255)]],
      created_at: [new Date().toISOString().split('T')[0], [Validators.required]],
      category_id: [''],
      shares: this.fb.array([])
    });
  }

  memberDebts = computed(() => {
    const debts = new Map<number, number>();

    // Инициализируем нулевые долги для всех участников
    this.members().forEach(member => debts.set(member.id, 0));

    // Рассчитываем долги на основе расходов
    this.expenses().forEach(expense => {
      const totalShares = expense.shares.length;
      const totalCustomShares = expense.shares.reduce((sum, share) => sum + (share.share || 0), 0);

      expense.shares.forEach(share => {
        if (!share.is_paid) {
          let shareAmount = 0;

          // Если указана конкретная сумма доли
          if (share.share && share.share > 0) {
            shareAmount = share.share;
          }
          // Если сумма не указана, делим поровну оставшуюся сумму
          else if (totalShares > 0) {
            const remainingAmount = expense.amount - totalCustomShares;
            const sharesWithoutCustomAmount = expense.shares.filter(s => !s.share || s.share === 0).length;
            shareAmount = sharesWithoutCustomAmount > 0 ? remainingAmount / sharesWithoutCustomAmount : 0;
          }

          // Добавляем к текущему долгу участника
          const currentDebt = debts.get(share.member_id) || 0;
          debts.set(share.member_id, currentDebt + shareAmount);
        }
      });
    });

    return debts;
  });

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    if (this.groupId) {
      this.loadGroupData();
    }
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  private async loadGroupData(): Promise<void> {
    if (!this.groupId) return;

    try {
      const [group, members, expenses] = await Promise.all([
        this.apiService.getGroup(this.groupId).toPromise(),
        this.apiService.getGroupMembers(this.groupId).toPromise(),
        this.apiService.getExpenses(this.groupId).toPromise()
      ]);

      this.group.set(group || null);
      this.members.set(members || []);
      this.expenses.set(expenses || []);

      // Загрузка категорий
      const categories = await this.apiService.getGroupCategories(this.groupId).toPromise();
      this.categories.set(categories || []);

      // Initialize charts after data is loaded
      setTimeout(() => {
        this.initializeCharts();
      }, 100);

    } catch (error) {
      console.error('Failed to load group data:', error);
      this.toast.error('Ошибка загрузки данных группы');
    } finally {
      this.loading.set(false);
    }
  }

  // Инициализация формы расхода
  initExpenseForm(expense?: ExpenseInDB): void {
    const sharesArray = this.expenseForm.get('shares') as FormArray;
    sharesArray.clear();

    if (expense) {
      // Заполнение формы для редактирования
      this.expenseForm.patchValue({
        amount: expense.amount,
        description: expense.description || '',
        created_at: expense.created_at,
        category_id: expense.category_id || ''
      });

      // Инициализация долей участников
      this.members().forEach(member => {
        const share = expense.shares.find(s => s.member_id === member.id);
        sharesArray.push(this.fb.group({
          member_id: [member.id],
          is_included: [!!share],
          share: [share?.share || null],
          is_paid: [share?.is_paid || false]
        }));
      });
    } else {
      // Для нового расхода
      this.expenseForm.patchValue({
        created_at: new Date().toISOString().split('T')[0]
      });

      // Инициализация долей участников
      this.members().forEach(member => {
        sharesArray.push(this.fb.group({
          member_id: [member.id],
          is_included: [true],
          share: [null],
          is_paid: [false]
        }));
      });
    }
  }

  // Получение контрола для доли участника
  getShareControl(index: number, controlName: string): FormControl {
    const sharesArray = this.expenseForm.get('shares') as FormArray;
    const shareGroup = sharesArray.at(index) as FormGroup;
    return shareGroup.get(controlName) as FormControl;
  }

  // Добавление участника
  async addMember(): Promise<void> {
    if (this.memberForm.valid && this.groupId) {
      this.submittingMember.set(true);
      const memberData: GroupMemberCreate = {
        name: this.memberForm.value.name,
        is_admin: this.memberForm.value.is_admin
      };

      try {
        const newMember = await this.apiService.addGroupMember(this.groupId, memberData).toPromise();
        if (newMember) {
          this.members.update(members => [...members, newMember]);
          this.toast.success('Участник успешно добавлен');
          this.closeMemberModal();
        }
      } catch (error) {
        console.error('Failed to add member:', error);
        this.toast.error('Ошибка добавления участника');
      } finally {
        this.submittingMember.set(false);
      }
    }
  }

  getMemberDebt(memberId: number): number {
    return this.memberDebts().get(memberId) || 0;
  }

  // Удаление участника
  async removeMember(memberId: number, event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.groupId) return;

    try {
      await this.apiService.removeGroupMember(this.groupId, memberId).toPromise();
      this.members.update(members => members.filter(m => m.id !== memberId));
      this.toast.success('Участник удален');
    } catch (error) {
      console.error('Failed to remove member:', error);
      this.toast.error('Ошибка удаления участника');
    }
  }

  // Добавление категории
  async addCategory(): Promise<void> {
    if (this.categoryForm.valid && this.groupId) {
      this.submittingCategory.set(true);
      const categoryData: CategoryCreate = {
        name: this.categoryForm.value.name,
        icon: this.categoryForm.value.icon,
        color: this.categoryForm.value.color,
        group_id: this.groupId
      };

      try {
        const newCategory = await this.apiService.createCategory(this.groupId, categoryData).toPromise();
        if (newCategory) {
          this.categories.update(categories => [...categories, newCategory]);
          this.toast.success('Категория успешно добавлена');
          this.closeCategoryModal();
        }
      } catch (error) {
        console.error('Failed to add category:', error);
        this.toast.error('Ошибка добавления категории');
      } finally {
        this.submittingCategory.set(false);
      }
    }
  }

  // Добавление расхода
  async addExpense(): Promise<void> {
    if (this.expenseForm.valid && this.groupId) {
      this.submittingExpense.set(true);

      // Формирование данных о долях
      const shares: ExpenseShareInput[] = [];
      const sharesArray = this.expenseForm.get('shares') as FormArray;

      sharesArray.controls.forEach((control) => {
        const shareGroup = control as FormGroup;
        if (shareGroup.value.is_included) {
          shares.push({
            member_id: shareGroup.value.member_id,
            share: shareGroup.value.share || null,
            is_paid: shareGroup.value.is_paid
          });
        }
      });

      const expenseData: ExpenseCreate = {
        amount: this.expenseForm.value.amount,
        description: this.expenseForm.value.description || null,
        created_at: this.expenseForm.value.created_at,
        category_id: this.expenseForm.value.category_id || null,
        group_id: this.groupId,
        shares: shares
      };

      try {
        const newExpense = await this.apiService.createExpense(this.groupId, expenseData).toPromise();
        if (newExpense) {
          this.expenses.update(expenses => [...expenses, newExpense]);
          this.toast.success('Расход успешно добавлен');
          this.initializeCharts();
          this.closeExpenseModal();
        }
      } catch (error) {
        console.error('Failed to create expense:', error);
        this.toast.error('Ошибка добавления расхода');
      } finally {
        this.submittingExpense.set(false);
      }
    }
  }

  // Редактирование расхода
  async updateExpense(): Promise<void> {
    if (this.expenseForm.valid && this.groupId && this.editingExpense) {
      this.submittingExpense.set(true);

      // Формирование данных о долях
      const shares: ExpenseShareInput[] = [];
      const sharesArray = this.expenseForm.get('shares') as FormArray;

      sharesArray.controls.forEach((control) => {
        const shareGroup = control as FormGroup;
        if (shareGroup.value.is_included) {
          shares.push({
            member_id: shareGroup.value.member_id,
            share: shareGroup.value.share || null,
            is_paid: shareGroup.value.is_paid
          });
        }
      });

      const expenseData: ExpenseUpdate = {
        amount: this.expenseForm.value.amount,
        description: this.expenseForm.value.description || null,
        created_at: this.expenseForm.value.created_at,
        category_id: this.expenseForm.value.category_id || null,
        shares: shares
      };

      try {
        const updatedExpense = await this.apiService.updateExpense(
          this.groupId,
          this.editingExpense.id,
          expenseData
        ).toPromise();

        if (updatedExpense) {
          this.expenses.update(expenses =>
            expenses.map(e => e.id === this.editingExpense?.id ? updatedExpense : e)
          );
          this.toast.success('Расход успешно обновлен');
          this.initializeCharts();
          this.closeExpenseModal();
        }
      } catch (error) {
        console.error('Failed to update expense:', error);
        this.toast.error('Ошибка обновления расхода');
      } finally {
        this.submittingExpense.set(false);
      }
    }
  }

  // Переключение статуса оплаты доли
  async toggleSharePayment(expenseId: string, memberId: number, isPaid: boolean, event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.groupId) return;

    try {
      const updatedExpense = await this.apiService.updateExpenseShare(
        this.groupId,
        expenseId,
        memberId,
        { member_id: memberId, is_paid: isPaid, share: null }
      ).toPromise();

      if (updatedExpense) {
        this.expenses.update(expenses =>
          expenses.map(e => e.id === expenseId ? updatedExpense : e)
        );
        this.toast.success(isPaid ? 'Оплата отмечена' : 'Оплата отменена');
      }
    } catch (error) {
      console.error('Failed to update share payment:', error);
      this.toast.error('Ошибка обновления статуса оплаты');
    }
  }

  // Получение названия категории по ID
  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.name : 'Неизвестная категория';
  }

  // Получение иконки категории по ID
  getCategoryIcon(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.icon : 'receipt';
  }

  // Получение цвета категории по ID
  getCategoryColor(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.color : '#cccccc';
  }

  // Получение контрастного цвета для текста
  getContrastColor(hexColor: string): string {
    // Удаляем # если есть
    const color = hexColor.replace('#', '');
    
    // Конвертируем в RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Вычисляем яркость
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  // Получение имени участника по ID
  getMemberName(memberId: number): string {
    const member = this.members().find(m => m.id === memberId);
    return member?.name || 'Неизвестный участник';
  }

  // Форматирование даты
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Редактирование расхода
  editExpense(expense: ExpenseInDB): void {
    this.editingExpense = expense;
    this.initExpenseForm(expense);
    this.showExpenseModal = true;
  }

  // Закрытие модальных окон
  closeMemberModal(): void {
    this.showMemberModal = false;
    this.memberForm.reset({ is_admin: false });
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.categoryForm.reset({ icon: 'receipt', color: '#3B82F6' });
  }

  closeExpenseModal(): void {
    this.showExpenseModal = false;
    this.expenseForm.reset();
    this.editingExpense = null;
  }

  private initializeCharts(): void {
    if (this.categoryChartRef && this.timeChartRef) {
      this.createCategoryChart();
      this.createTimeChart();
    }
  }

  private createCategoryChart(): void {
    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    // Calculate expenses by category
    const categoryExpenses = new Map<string, { amount: number; color: string }>();
    
    // Initialize with categories
    this.categories().forEach(category => {
      categoryExpenses.set(category.name, { amount: 0, color: category.color });
    });
    
    // Add uncategorized
    categoryExpenses.set('Без категории', { amount: 0, color: '#9CA3AF' });

    // Sum expenses by category
    this.expenses().forEach(expense => {
      if (expense.category_id) {
        const categoryName = this.getCategoryName(expense.category_id);
        const categoryColor = this.getCategoryColor(expense.category_id);
        const current = categoryExpenses.get(categoryName) || { amount: 0, color: categoryColor };
        categoryExpenses.set(categoryName, { amount: current.amount + expense.amount, color: categoryColor });
      } else {
        const current = categoryExpenses.get('Без категории') || { amount: 0, color: '#9CA3AF' };
        categoryExpenses.set('Без категории', { amount: current.amount + expense.amount, color: '#9CA3AF' });
      }
    });

    // Filter out zero values
    const filteredEntries = Array.from(categoryExpenses.entries()).filter(([, data]) => data.amount > 0);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: filteredEntries.map(([name]) => name),
        datasets: [{
          data: filteredEntries.map(([, data]) => data.amount),
          backgroundColor: filteredEntries.map(([, data]) => data.color),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                return `${context.label}: ₽${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    };

    this.categoryChart = new Chart(ctx, config);
  }

  private createTimeChart(): void {
    const ctx = this.timeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.timeChart) {
      this.timeChart.destroy();
    }

    // Group expenses by month
    const monthlyExpenses = new Map<string, number>();
    
    this.expenses().forEach(expense => {
      const date = new Date(expense.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyExpenses.get(monthKey) || 0;
      monthlyExpenses.set(monthKey, current + expense.amount);
    });

    // Sort by date and get last 6 months
    const sortedEntries = Array.from(monthlyExpenses.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: sortedEntries.map(([monthKey]) => {
          const [year, month] = monthKey.split('-');
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ru-RU', { 
            month: 'short', 
            year: 'numeric' 
          });
        }),
        datasets: [{
          label: 'Расходы (₽)',
          data: sortedEntries.map(([, amount]) => amount),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Расходы: ₽${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₽' + Number(value).toLocaleString();
              }
            }
          }
        }
      }
    };

    this.timeChart = new Chart(ctx, config);
  }
}