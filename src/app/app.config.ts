import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  User,
  Lock,
  Trophy,
  Volleyball,
  Star,
  Calendar,
  ArrowLeft,
  Bell,
  Flag,
  Inbox,
  Menu,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        User,
        Lock,
        Trophy,
        Volleyball,
        Star,
        Calendar,
        ArrowLeft,
        Bell,
        Flag,
        Inbox,
        Menu,
        ArrowUp,
        ArrowDown,
        Search,
        X,
      }),
    ),
  ],
};
