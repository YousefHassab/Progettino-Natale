import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService, UserData } from '../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  user: any = null;
  userData: UserData | null = null;
  showDemoLogin = false;
  showLoginForm = false;
  showRegisterForm = false;
  
  loginEmail = '';
  loginPassword = '';
  registerEmail = '';
  registerPassword = '';
  registerName = '';
  
  // Messaggi per l'utente
  loginMessage = '';
  loginSuccess = false;
  registerMessage = '';
  registerSuccess = false;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(async (user) => {
      this.user = user;
      
      if (user) {
        // Prova a caricare i dati utente dal servizio
        try {
          this.userService.getUserData(user.uid).subscribe((data) => {
            this.userData = data;
          });
        } catch (error) {
          // Se il servizio non funziona, usa dati demo
          console.log('Using demo user data');
          this.userData = {
            uid: user.uid,
            email: user.email || '',
            displayName: (user as any).displayName || 'Giocatore Demo',
            credits: 1000,
            createdAt: new Date(),
            lastLogin: new Date(),
            gamesPlayed: {
              slotMachine: 0,
              blackjack: 0,
              roulette: 0
            },
            totalWins: 0,
            totalLosses: 0
          };
        }
      } else {
        this.userData = null;
      }
    });

    // Carica utenti registrati
    this.authService.loadRegisteredUsers();
  }

  get userCredits(): number {
    return this.userData?.credits || 0;
  }

  async demoLogin() {
    try {
      const result = await this.authService.demoLogin();
      this.loginMessage = result.message;
      this.loginSuccess = result.success;
      
      if (result.success) {
        this.showDemoLogin = false;
        setTimeout(() => {
          this.loginMessage = '';
        }, 3000);
      }
    } catch (error) {
      console.error('Demo login error:', error);
      this.loginMessage = 'Errore nel login demo';
      this.loginSuccess = false;
    }
  }

  async login() {
    if (!this.loginEmail || !this.loginPassword) {
      this.loginMessage = 'Inserisci email e password';
      this.loginSuccess = false;
      return;
    }

    this.loginMessage = 'Accesso in corso...';
    this.loginSuccess = false;

    try {
      const result = await this.authService.login(this.loginEmail, this.loginPassword);
      this.loginMessage = result.message;
      this.loginSuccess = result.success;
      
      if (result.success) {
        this.showLoginForm = false;
        this.loginEmail = '';
        this.loginPassword = '';
        
        // Nascondi il messaggio dopo 3 secondi
        setTimeout(() => {
          this.loginMessage = '';
        }, 3000);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.loginMessage = error.message || 'Errore nel login';
      this.loginSuccess = false;
    }
  }

  async register() {
    if (!this.registerEmail || !this.registerPassword || !this.registerName) {
      this.registerMessage = 'Completa tutti i campi';
      this.registerSuccess = false;
      return;
    }

    if (this.registerPassword.length < 6) {
      this.registerMessage = 'La password deve essere di almeno 6 caratteri';
      this.registerSuccess = false;
      return;
    }

    if (this.authService.isEmailRegistered(this.registerEmail)) {
      this.registerMessage = 'Email già registrata. Usa un\'altra email.';
      this.registerSuccess = false;
      return;
    }

    this.registerMessage = 'Registrazione in corso...';
    this.registerSuccess = false;

    try {
      const result = await this.authService.register(this.registerEmail, this.registerPassword, this.registerName);
      this.registerMessage = result.message;
      this.registerSuccess = result.success;
      
      if (result.success) {
        // Reset form e mostra messaggio di successo
        this.registerEmail = '';
        this.registerPassword = '';
        this.registerName = '';
        
        // Cambia automaticamente alla tab di login dopo 2 secondi
        setTimeout(() => {
          this.showRegisterForm = false;
          this.showLoginForm = true;
          this.registerMessage = '';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      this.registerMessage = error.message || 'Errore nella registrazione';
      this.registerSuccess = false;
    }
  }

  async addCredits() {
    if (!this.user) {
      alert('Accedi per aggiungere crediti!');
      return;
    }

    // Per demo: aggiungi crediti
    if (this.userData) {
      this.userData.credits += 500;
      alert('Aggiunti 500 crediti! Totale: ' + this.userData.credits);
      
      // Se il servizio user è disponibile, aggiorna anche lì
      try {
        await this.userService.addCredits(this.user.uid, 500);
      } catch (error) {
        console.log('User service non disponibile, usando demo mode');
      }
    }
  }

  logout() {
    this.authService.logout();
    this.loginMessage = '';
    this.registerMessage = '';
  }

  // Metodi per gestire i form
  showLogin() {
    this.showLoginForm = true;
    this.showRegisterForm = false;
    this.loginMessage = '';
    this.registerMessage = '';
  }

  showRegister() {
    this.showRegisterForm = true;
    this.showLoginForm = false;
    this.loginMessage = '';
    this.registerMessage = '';
  }
}
