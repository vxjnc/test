import { Injectable, signal } from '@angular/core';
import { Toast } from '../components/ui/toast.component';

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts = signal<Toast[]>([]);

    getToasts = this.toasts.asReadonly();

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    show(message: string, type: Toast['type'] = 'info', duration = 5000): void {
        const id = this.generateId();
        const toast: Toast = { id, message, type };

        this.toasts.update(toasts => [...toasts, toast]);

        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    success(message: string, duration?: number): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number): void {
        this.show(message, 'error', duration);
    }

    info(message: string, duration?: number): void {
        this.show(message, 'info', duration);
    }

    warning(message: string, duration?: number): void {
        this.show(message, 'warning', duration);
    }

    remove(id: string): void {
        this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
    }
}