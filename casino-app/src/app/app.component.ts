import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { UserService, UserData } from './services/user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'casino-app';
  user: any = null;
  userData: UserData | null = null;
  showLogin = false;
  showRegister = false;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Sottoscrizione all'utente autenticato
    this.authService.currentUser$.subscribe(async (user) => {
      this.user = user;
      
      if (user) {
        // Carica i dati dell'utente
        this.userService.getUserData(user.uid).subscribe((data) => {
          this.userData = data;
        });
      } else {
        this.userData = null;
      }
    });
  }

  get userCredits(): number {
    return this.userData?.credits || 0;
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
