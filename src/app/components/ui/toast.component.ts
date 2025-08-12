import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (toast) {
      <div 
        [@slideIn]
        class="fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        [ngClass]="{
          'border-l-4 border-l-green-500': toast.type === 'success',
          'border-l-4 border-l-red-500': toast.type === 'error',
          'border-l-4 border-l-blue-500': toast.type === 'info',
          'border-l-4 border-l-yellow-500': toast.type === 'warning'
        }"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            @switch (toast.type) {
              @case ('success') {
                <div class="w-5 h-5 text-green-500">✓</div>
              }
              @case ('error') {
                <div class="w-5 h-5 text-red-500">✗</div>
              }
              @case ('info') {
                <div class="w-5 h-5 text-blue-500">ℹ</div>
              }
              @case ('warning') {
                <div class="w-5 h-5 text-yellow-500">⚠</div>
              }
            }
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm text-gray-900">{{ toast.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button
              (click)="eventClose.emit()"
              class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span class="sr-only">Close</span>
              <span class="w-5 h-5">×</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateX(100%)', opacity: 0 }),
                animate('300ms ease-in-out', style({ transform: 'translateX(0%)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('300ms ease-in-out', style({ transform: 'translateX(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class ToastComponent {
    @Input() toast: Toast | null = null;
    @Output() eventClose = new EventEmitter<void>();
}