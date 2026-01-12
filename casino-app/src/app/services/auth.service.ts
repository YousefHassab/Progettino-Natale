import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, 
         signInWithEmailAndPassword, 
         signOut, 
         User, 
         UserCredential,
         onAuthStateChanged } from '@angular/fire/auth';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Demo user per testing
  private demoUsers = [
    {
      email: 'demo@casino.it',
      password: 'demo123',
      displayName: 'Giocatore Demo',
      uid: 'demo-123',
      credits: 5000
    },
    {
      email: 'test@casino.it',
      password: 'test123',
      displayName: 'Giocatore Test',
      uid: 'test-456',
      credits: 3000
    }
  ];

  constructor(private auth: Auth, private firestore: Firestore) {
    // Ascolta i cambiamenti di stato dell'autenticazione
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });

    // Per demo: controlla se c'è un utente salvato in localStorage
    this.checkLocalStorageUser();
  }

  // Metodo per demo: controlla localStorage
  private checkLocalStorageUser() {
    const savedUser = localStorage.getItem('demoUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
  }

  // Registrazione con email e password - NON fa login automatico
  async register(email: string, password: string, displayName: string): Promise<{success: boolean, message: string}> {
    try {
      // Controlla se l'email è già usata (demo users)
      const existingDemoUser = this.demoUsers.find(u => u.email === email);
      if (existingDemoUser) {
        return {
          success: false,
          message: 'Email già registrata. Usa un\'altra email.'
        };
      }

      // Per demo: crea un utente locale ma NON fa il login
      const demoUser = {
        email,
        displayName,
        uid: 'user-' + Date.now(),
        credits: 1000,
        password: password // Memorizziamo la password per il successivo login
      };

      // Aggiungi ai demo users
      this.demoUsers.push(demoUser);
      
      // Salva in localStorage (solo per persistenza, non per login)
      localStorage.setItem('registeredUsers', JSON.stringify(this.demoUsers));
      
      return {
        success: true,
        message: 'Registrazione completata! Ora puoi fare il login.'
      };
      
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Errore durante la registrazione'
      };
    }
  }

  // Login con email e password
  async login(email: string, password: string): Promise<{success: boolean, message: string, user?: any}> {
    try {
      // Cerca nelle credenziali demo
      const demoUser = this.demoUsers.find(u => 
        u.email === email && u.password === password
      );

      if (demoUser) {
        // Usa utente demo
        const userCredential = {
          user: {
            uid: demoUser.uid,
            email: demoUser.email,
            displayName: demoUser.displayName
          } as User
        } as UserCredential;

        // Salva in localStorage
        localStorage.setItem('demoUser', JSON.stringify(userCredential.user));
        this.currentUserSubject.next(userCredential.user);

        return {
          success: true,
          message: 'Login effettuato con successo!',
          user: userCredential.user
        };
      }

      // Se Firebase è configurato, prova l'autenticazione reale
      if (this.auth) {
        try {
          const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
          
          // Crea il documento utente in Firestore se non esiste
          const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
          await setDoc(userDocRef, {
            uid: userCredential.user.uid,
            email: email,
            displayName: userCredential.user.displayName || email.split('@')[0],
            credits: 1000,
            createdAt: new Date(),
            lastLogin: new Date()
          }, { merge: true });

          return {
            success: true,
            message: 'Login effettuato con successo!',
            user: userCredential.user
          };
        } catch (firebaseError: any) {
          return {
            success: false,
            message: firebaseError.message || 'Credenziali non valide'
          };
        }
      }

      return {
        success: false,
        message: 'Credenziali non valide'
      };
      
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Errore durante il login'
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      if (this.auth) {
        await signOut(this.auth);
      }
      
      // Rimuovi da localStorage
      localStorage.removeItem('demoUser');
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Ottieni l'utente corrente
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Controlla se l'utente è autenticato
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Metodo per demo login rapido
  demoLogin(): Promise<{success: boolean, message: string, user?: any}> {
    return this.login('demo@casino.it', 'demo123');
  }

  // Controlla se un'email è già registrata
  isEmailRegistered(email: string): boolean {
    return this.demoUsers.some(u => u.email === email);
  }

  // Carica utenti registrati da localStorage
  loadRegisteredUsers() {
    const saved = localStorage.getItem('registeredUsers');
    if (saved) {
      try {
        const users = JSON.parse(saved);
        this.demoUsers = users;
      } catch (e) {
        console.error('Error loading registered users', e);
      }
    }
  }
}
