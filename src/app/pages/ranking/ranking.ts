import { Component, DestroyRef, OnInit } from '@angular/core';
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

  constructor(
    private userService: UserService,
    private auth: Auth,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit() {
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.currentUserId = user ? user.id : null;
    });

    this.userService.getRanking().subscribe((data) => {
      this.users = data;
      this.loading = false;
    });
  }

  get top3(): User[] {
    return this.users.slice(0, 3);
  }

  get hasPodium(): boolean {
    return this.users.length >= 3;
  }

  get rest(): User[] {
    return this.users.slice(3);
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
