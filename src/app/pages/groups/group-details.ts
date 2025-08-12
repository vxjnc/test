import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
                 [class.text-gray-600]="getMemberDebt(member.id) === 0">
                {{ getMemberDebt(member.id) | number:'1.2-2' }} ₽
              </p>
              <p class="text-xs text-gray-500">
                {{ getMemberDebt(member.id) > 0 ? 'Долг' : 'Нет долга' }}
              </p>
            </div>
            <button
              (click)="removeMember(member.id, $event)"
              class="text-red-500 hover:text-red-700"
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
                <div class="space-y-3">
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
                              {{ expense.created_at }}
                              @if (expense.category_id) {
                                <span class="ml-2 px-2 py-1 bg-gray-200 rounded-full">
                                  {{ getCategoryName(expense.category_id) }}
                                </span>
                              }
                            </p>
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
                                      Оплачено
                                    </span>
                                  } @else {
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                      Ожидает оплаты
                                    </span>
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
            
            <!-- Категории группы -->
            <div class="mt-8">
              <h2 class="text-lg font-medium text-gray-900 mb-4">Категории</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                @for (category of categories(); track category.id) {
                  <div class="card p-4 flex items-center">
                    <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <mat-icon>{{category.icon}}</mat-icon>
                    </div>
                    <span>{{ category.name }}</span>
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
                      <input
                        id="categoryIcon"
                        type="text"
                        formControlName="icon"
                        class="form-input"
                        placeholder="Введите иконку (например, 🍔)"
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
              <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    {{ editingExpense ? 'Редактировать расход' : 'Добавить расход' }}
                  </h3>
                  <form [formGroup]="expenseForm" (ngSubmit)="editingExpense ? updateExpense() : addExpense()">
                    <div class="mb-4">
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
                      <div class="space-y-3">
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
                            
                            <div class="ml-6 space-y-2">
                              <!-- <div>
                                <label [for]="'shareAmount'+i" class="block text-sm text-gray-500 mb-1">
                                  Доля (₽)
                                </label>
                                <input
                                  [id]="'shareAmount'+i"
                                  type="number"
                                  step="0.01"
                                  [formControl]="getShareControl(i, 'share')"
                                  class="form-input w-full"
                                  placeholder="0.00"
                                />
                              </div> -->
                              
                              <div class="flex items-center">
                                <input
                                  [id]="'isPaid'+i"
                                  type="checkbox"
                                  [formControl]="getShareControl(i, 'is_paid')"
                                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label [for]="'isPaid'+i" class="ml-2 block text-sm text-gray-500">
                                  Оплачено
                                </label>
                              </div>
                            </div>
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
export class GroupDetailsComponent implements OnInit {
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

  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  constructor(
  ) {
    // Форма для добавления участника
    this.memberForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      is_admin: [false]
    });

    // Форма для добавления категории
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      icon: ['receipt']
    });

    // Форма для добавления расхода
    this.expenseForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.maxLength(255)]],
      created_at: [new Date().toISOString(), [Validators.required]],
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

      expense.shares.forEach(share => {
        if (!share.is_paid) {
          let shareAmount = 0;

          // Если указана конкретная сумма доли
          if (share.share && share.share > 0) {
            shareAmount = share.share;
          }
          // Если сумма не указана, делим поровну
          else if (totalShares > 0) {
            shareAmount = expense.amount / totalShares;
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

    }
    catch (error) {
      console.error('Failed to load group data:', error);
      this.toast.error('Ошибка загрузки данных группы');
    }
    finally {
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

      this.members().forEach(member => {
        const share = expense.shares.find(s => s.member_id === member.id);
        sharesArray.push(this.fb.group({
          member_id: [member.id],
          is_included: [share ? true : false], // Используем is_included
          share: [share?.share || null],
          is_paid: [share?.is_paid || false]
        }));
      });
    }
    else {
      // Для нового расхода
      this.expenseForm.patchValue({
        created_at: new Date().toISOString()
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
      }
      catch (error) {
        console.error('Failed to add member:', error);
        this.toast.error('Ошибка добавления участника');
      }
      finally {
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
    }
    catch (error) {
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
        group_id: this.groupId
      };

      try {
        const newCategory = await this.apiService.createCategory(this.groupId, categoryData).toPromise();
        if (newCategory) {
          this.categories.update(categories => [...categories, newCategory]);
          this.toast.success('Категория успешно добавлена');
          this.closeCategoryModal();
        }
      }
      catch (error) {
        console.error('Failed to add category:', error);
        this.toast.error('Ошибка добавления категории');
      }
      finally {
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
        created_at: new Date(this.expenseForm.value.created_at).toISOString(),
        category_id: this.expenseForm.value.category_id || null,
        group_id: this.groupId,
        shares: shares
      };

      try {
        const newExpense = await this.apiService.createExpense(this.groupId, expenseData).toPromise();
        if (newExpense) {
          this.expenses.update(expenses => [...expenses, newExpense]);
          this.toast.success('Расход успешно добавлен');
          this.closeExpenseModal();
        }
      }
      catch (error) {
        console.error('Failed to create expense:', error);
        this.toast.error('Ошибка добавления расхода');
      }
      finally {
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
        created_at: new Date(this.expenseForm.value.created_at).toISOString(),
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
          this.closeExpenseModal();
        }
      }
      catch (error) {
        console.error('Failed to update expense:', error);
        this.toast.error('Ошибка обновления расхода');
      }
      finally {
        this.submittingExpense.set(false);
      }
    }
  }

  // Получение названия категории по ID
  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.name : 'Неизвестная категория';
  }

  // Получение имени участника по ID
  getMemberName(memberId: number): string {
    const member = this.members().find(m => m.id === memberId);
    return member?.name || 'Неизвестный участник';
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
    this.categoryForm.reset({ icon: 'receipt' });
  }

  closeExpenseModal(): void {
    this.showExpenseModal = false;
    this.expenseForm.reset();
    this.editingExpense = null;
  }
}