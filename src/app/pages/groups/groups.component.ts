import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { GroupInDB } from '../../models/api.models';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-groups',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, MatIconModule],
    template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Мои группы</h1>
              <p class="mt-1 text-sm text-gray-500">
                Управляйте расходами в группах друзей, коллег или семьи
              </p>
            </div>
            <button
              (click)="showCreateModal = true"
              class="btn-primary"
            >
              <mat-icon class="mr-2">add</mat-icon>
              Создать группу
            </button>
          </div>

          @if (loading()) {
            <div class="flex justify-center py-12">
              <app-loading-spinner />
            </div>
          } @else {
            @if (groups().length === 0) {
              <div class="text-center py-12">
                <mat-icon class="mx-auto text-gray-400 text-6xl">group</mat-icon>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Нет групп</h3>
                <p class="mt-1 text-sm text-gray-500">Начните с создания своей первой группы для отслеживания расходов.</p>
                <div class="mt-6">
                  <button
                    (click)="showCreateModal = true"
                    class="btn-primary"
                  >
                    <mat-icon class="mr-2">add</mat-icon>
                    Создать первую группу
                  </button>
                </div>
              </div>
            } @else {
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @for (group of groups(); track group.id) {
                  <div class="card hover:shadow-md transition-shadow cursor-pointer"
                       (click)="navigateToGroup(group.id)">
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <h3 class="text-lg font-medium text-gray-900">{{ group.name }}</h3>
                        <p class="mt-1 text-sm text-gray-500">ID: {{ group.id }}</p>
                      </div>
                      <div class="flex items-center space-x-2">
                        <button
                          (click)="editGroup(group, $event)"
                          class="text-gray-400 hover:text-gray-600"
                          title="Редактировать"
                        >
                          <mat-icon>edit</mat-icon>
                        </button>
                        <mat-icon class="text-gray-400">chevron_right</mat-icon>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- Create Group Modal -->
          @if (showCreateModal) {
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    {{ editingGroup ? 'Редактировать группу' : 'Создать новую группу' }}
                  </h3>
                  <form [formGroup]="groupForm" (ngSubmit)="onSubmitGroup()">
                    <div class="mb-4">
                      <label for="groupName" class="form-label">Название группы</label>
                      <input
                        id="groupName"
                        type="text"
                        formControlName="name"
                        class="form-input"
                        placeholder="Введите название группы"
                      />
                      @if (groupForm.get('name')?.touched && groupForm.get('name')?.errors) {
                        <p class="mt-1 text-sm text-red-600">Введите название группы</p>
                      }
                    </div>
                    <div class="flex justify-end space-x-3">
                      <button
                        type="button"
                        (click)="closeModal()"
                        class="btn-outline"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        [disabled]="!groupForm.valid || submittingGroup()"
                        class="btn-primary disabled:opacity-50"
                      >
                        @if (submittingGroup()) {
                          <app-loading-spinner />
                        } @else {
                          {{ editingGroup ? 'Сохранить' : 'Создать' }}
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
export class GroupsComponent implements OnInit {
    loading = signal(false);
    submittingGroup = signal(false);
    groups = signal<GroupInDB[]>([]);
    showCreateModal = false;
    editingGroup: GroupInDB | null = null;
    groupForm: FormGroup;

    router: Router = inject(Router);

    private apiService = inject(ApiService);
    private toast = inject(ToastService);
    private fb = inject(FormBuilder);

    constructor(
    ) {
        this.groupForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]]
        });
    }

    ngOnInit(): void {
        this.loadGroups();
    }

    private async loadGroups(): Promise<void> {
        this.loading.set(true);

        try {
            const groups = await this.apiService.getGroups().toPromise();
            if (groups) {
                this.groups.set(groups);
            }
        }
        catch (error) {
            console.error('Failed to load groups:', error);
            this.toast.error('Ошибка загрузки групп');
        }
        finally {
            this.loading.set(false);
        }
    }

    navigateToGroup(groupId: string): void {
        this.router.navigate(['/groups', groupId]); // Реализация навигации
    }

    editGroup(group: GroupInDB, event: Event): void {
        event.stopPropagation();
        this.editingGroup = group;
        this.groupForm.patchValue({ name: group.name });
        this.showCreateModal = true;
    }

    closeModal(): void {
        this.showCreateModal = false;
        this.editingGroup = null;
        this.groupForm.reset();
    }

    async onSubmitGroup(): Promise<void> {
        if (this.groupForm.valid) {
            this.submittingGroup.set(true);

            try {
                const { name } = this.groupForm.value;

                if (this.editingGroup) {
                    // Update existing group
                    const updatedGroup = await this.apiService.updateGroup(this.editingGroup.id, { name }).toPromise();
                    if (updatedGroup) {
                        this.groups.update(groups =>
                            groups.map(g => g.id === this.editingGroup?.id ? updatedGroup : g)
                        );
                        this.toast.success('Группа успешно обновлена');
                    }
                }
                else {
                    // Create new group
                    const newGroup = await this.apiService.createGroup({ name }).toPromise();
                    if (newGroup) {
                        this.groups.update(groups => [...groups, newGroup]);
                        this.toast.success('Группа успешно создана');
                    }
                }

                this.closeModal();
            }
            catch (error) {
                console.error('Failed to save group:', error);
                this.toast.error('Ошибка сохранения группы');
            }
            finally {
                this.submittingGroup.set(false);
            }
        }
    }
}