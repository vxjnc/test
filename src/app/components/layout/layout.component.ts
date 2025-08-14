import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { ToastComponent } from '../ui/toast.component';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, HeaderComponent, ToastComponent],
    template: `
    <div class="min-h-screen bg-gray-50">
      <app-header />
      <main>
        <router-outlet />
      </main>
      
      <!-- Toast notifications -->
      @for (toast of toastService.getToasts(); track toast.id) {
        <app-toast 
          [toast]="toast" 
          (eventClose)="toastService.remove(toast.id)"
        />
      }
    </div>
  `
})
export class LayoutComponent {
    public toastService = inject(ToastService);
}