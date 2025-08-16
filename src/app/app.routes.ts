import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'auth/login',
        canActivate: [GuestGuard],
        loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'auth/register',
        canActivate: [GuestGuard],
        loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent)
    },
    {
        path: '',
        canActivate: [AuthGuard],
        loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'groups',
                loadComponent: () => import('./pages/groups/groups.component').then(m => m.GroupsComponent)
            },
            {
                path: 'groups/:groupId',
                loadComponent: () => import('./pages/groups/group-details').then(m => m.GroupDetailsComponent)
            },
            {
                path: 'expenses',
                loadComponent: () => import('./pages/expenses/expenses.component').then(m => m.ExpensesComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];