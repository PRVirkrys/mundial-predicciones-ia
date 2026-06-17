import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  importProvidersFrom,
  LOCALE_ID,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
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

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'es' },
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
