import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserCard } from '../../shared/components/user-card/user-card';
import { UserService } from '../../core/services/user.service';
import { Auth } from '../../core/services/auth';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-ranking',
  imports: [UserCard],
  templateUrl: './ranking.html',
  styleUrl: './ranking.css',
})
export class Ranking implements OnInit {
  users: User[] = [];
  currentUserId: number | null = null;
  loading = true;
  error = false;

  constructor(
    private userService: UserService,
    private auth: Auth,
    private destroyRef: DestroyRef,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.currentUserId = user ? user.id : null;
    });

    console.log('[Ranking] Iniciando carga...');

    this.userService
      .getRanking()
      .pipe(
        catchError((err) => {
          console.warn('[Ranking] getRanking() falló:', err.status, err.message);
          console.log('[Ranking] Intentando fallback con getUsers()...');
          return this.userService.getUsers().pipe(
            catchError((err2) => {
              console.error('[Ranking] getUsers() también falló:', err2.status, err2.message);
              return of([]);
            }),
          );
        }),
      )
      .subscribe({
        next: (data) => {
          console.log('[Ranking] Datos recibidos:', data);
          this.users = [...data].sort((a, b) => b.totalScore - a.totalScore);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[Ranking] Error inesperado en subscribe:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
        complete: () => console.log('[Ranking] Observable completado'),
      });
  }

  get top3(): User[] {
    return this.users.slice(0, 3);
  }

  get hasPodium(): boolean {
    return this.users.length >= 3;
  }

  navigateToPlayer(userId: number) {
    if (userId === this.currentUserId) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/players', userId]);
    }
  }

  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
}
