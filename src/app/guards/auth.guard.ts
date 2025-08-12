import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): boolean {
        if (this.authService.isAuthenticated()) {
            return true;
        }
        else {
            this.router.navigate(['/auth/login']);
            return false;
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class GuestGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): boolean {
        if (!this.authService.isAuthenticated()) {
            return true;
        }
        else {
            this.router.navigate(['/dashboard']);
            return false;
        }
    }
}