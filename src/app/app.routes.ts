import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Matches } from './pages/matches/matches';
import { Login } from './pages/login/login';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: Matches,
        title: 'Matches',
      },

      {
        path: 'ranking',
        loadComponent: () => import('./pages/ranking/ranking').then((m) => m.Ranking),
        title: 'Ranking',
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
        title: 'Profile',
      },
    ],
  },
  {
    path: 'login',
    component: AuthLayout,
    title: 'Login',
  },
];
