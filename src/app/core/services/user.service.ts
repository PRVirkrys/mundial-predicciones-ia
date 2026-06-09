import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `http://${window.location.hostname}:8081`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getRanking(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/ranking`);
  }

  login(name: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/login`, { name, password });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }
}
