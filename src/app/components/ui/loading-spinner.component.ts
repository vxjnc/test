import { Component } from '@angular/core';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    template: `
    <div class="flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  `
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LoadingSpinnerComponent { }