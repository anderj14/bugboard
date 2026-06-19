import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard').then(
                (m) => m.Dashboard
            ),
    },
    {
        path: 'bugs/:id',
        loadComponent: () =>
            import('./features/bug-detail/bug-detail').then(
                (m) => m.BugDetail
            ),
    },
    {
        path: 'report',
        loadComponent: () =>
            import('./features/bug-report/bug-report').then(
                (m) => m.BugReport
            ),
    },
    {
        path: 'metrics',
        loadComponent: () =>
            import('./features/metrics/metrics').then(
                (m) => m.Metrics
            ),
    },
    {
        path: '**',
        loadComponent: () =>
            import('./features/dashboard/dashboard').then(
                (m) => m.Dashboard
            ),
    },
];
