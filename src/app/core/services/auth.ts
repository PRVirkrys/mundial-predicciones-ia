import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(
    private userService: UserService,
    private router: Router,
  ) {}

  private currentUser = new BehaviorSubject<User | null>(this.getCurrentUser());
  currentUser$ = this.currentUser.asObservable();

  onLogin(name: string, password: string) {
    return this.userService.login(name, password);
  }

  setCurrentUser(user: User) {
    this.currentUser.next(user);
  }

  logOut() {
    localStorage.removeItem('user');
    this.currentUser.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  getCurrentUserId(): number {
    return this.getCurrentUser()?.id;
  }

  refreshCurrentUser() {
    const id = this.getCurrentUserId();
    if (!id) return;
    this.userService.getUserById(id).subscribe((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUser.next(user);
    });
  }
}
