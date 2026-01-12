import { Injectable } from '@angular/core';
import { Firestore, doc, docData, updateDoc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  credits: number;
  createdAt: Date;
  lastLogin: Date;
  gamesPlayed?: {
    slotMachine: number;
    blackjack: number;
    roulette: number;
  };
  totalWins?: number;
  totalLosses?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private demoUsers: Map<string, UserData> = new Map();
  private userDataSubject = new BehaviorSubject<UserData | null>(null);

  constructor(private firestore: Firestore, private auth: Auth) {
    this.initializeDemoUsers();
  }

  private initializeDemoUsers() {
    // Demo users predefiniti
    this.demoUsers.set('demo-123', {
      uid: 'demo-123',
      email: 'demo@casino.it',
      displayName: 'Giocatore Demo',
      credits: 5000,
      createdAt: new Date(),
      lastLogin: new Date(),
      gamesPlayed: {
        slotMachine: 0,
        blackjack: 0,
        roulette: 0
      },
      totalWins: 0,
      totalLosses: 0
    });

    this.demoUsers.set('test-456', {
      uid: 'test-456',
      email: 'test@casino.it',
      displayName: 'Giocatore Test',
      credits: 3000,
      createdAt: new Date(),
      lastLogin: new Date(),
      gamesPlayed: {
        slotMachine: 0,
        blackjack: 0,
        roulette: 0
      },
      totalWins: 0,
      totalLosses: 0
    });
  }

  // Ottieni i dati dell'utente corrente
  getUserData(uid: string): Observable<UserData> {
    // Prima prova con Firestore
    if (this.firestore) {
      try {
        const userDocRef = doc(this.firestore, 'users', uid);
        return docData(userDocRef).pipe(
          map(data => data as UserData),
          catchError(error => {
            console.log('Firestore non disponibile, usando demo data');
            return this.getDemoUserData(uid);
          })
        );
      } catch (error) {
        console.log('Errore Firestore, usando demo');
        return this.getDemoUserData(uid);
      }
    }
    
    // Se Firestore non è disponibile, usa demo
    return this.getDemoUserData(uid);
  }

  private getDemoUserData(uid: string): Observable<UserData> {
    let userData = this.demoUsers.get(uid);
    
    if (!userData) {
      // Crea un nuovo utente demo
      userData = {
        uid: uid,
        email: 'user@demo.it',
        displayName: 'Nuovo Giocatore',
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
      this.demoUsers.set(uid, userData);
    }
    
    // Aggiorna ultimo login
    userData.lastLogin = new Date();
    this.demoUsers.set(uid, userData);
    
    // Salva in localStorage per persistenza
    localStorage.setItem(`demoUser_${uid}`, JSON.stringify(userData));
    
    return of(userData);
  }

  // Aggiorna i crediti dell'utente
  async updateCredits(uid: string, newCredits: number): Promise<void> {
    // Prova Firestore prima
    if (this.firestore) {
      try {
        const userDocRef = doc(this.firestore, 'users', uid);
        await updateDoc(userDocRef, {
          credits: newCredits,
          lastLogin: new Date()
        });
        return;
      } catch (error) {
        console.log('Firestore non disponibile, usando demo');
      }
    }
    
    // Demo mode
    const userData = await this.getUserData(uid).toPromise();
    if (userData) {
      userData.credits = newCredits;
      userData.lastLogin = new Date();
      this.demoUsers.set(uid, userData);
      localStorage.setItem(`demoUser_${uid}`, JSON.stringify(userData));
    }
  }

  // Aggiungi crediti
  async addCredits(uid: string, amount: number): Promise<void> {
    const userData = await this.getUserData(uid).toPromise();
    
    if (userData) {
      const newCredits = (userData.credits || 0) + amount;
      await this.updateCredits(uid, newCredits);
    }
  }

  // Sottrai crediti
  async subtractCredits(uid: string, amount: number): Promise<void> {
    const userData = await this.getUserData(uid).toPromise();
    
    if (userData) {
      if (userData.credits >= amount) {
        const newCredits = userData.credits - amount;
        await this.updateCredits(uid, newCredits);
      } else {
        throw new Error('Crediti insufficienti');
      }
    }
  }

  // Aggiorna statistiche gioco
  async updateGameStats(uid: string, gameType: 'slotMachine' | 'blackjack' | 'roulette', won: boolean, amount: number): Promise<void> {
    const userData = await this.getUserData(uid).toPromise();
    
    if (userData) {
      // Aggiorna contatore giochi
      if (!userData.gamesPlayed) {
        userData.gamesPlayed = {
          slotMachine: 0,
          blackjack: 0,
          roulette: 0
        };
      }
      
      userData.gamesPlayed[gameType] = (userData.gamesPlayed[gameType] || 0) + 1;
      
      // Aggiorna vincite/perdite
      if (won) {
        userData.totalWins = (userData.totalWins || 0) + 1;
        userData.credits = (userData.credits || 0) + amount;
      } else {
        userData.totalLosses = (userData.totalLosses || 0) + 1;
        userData.credits = Math.max(0, (userData.credits || 0) - amount);
      }
      
      userData.lastLogin = new Date();
      
      // Salva
      if (this.firestore) {
        try {
          const userDocRef = doc(this.firestore, 'users', uid);
          await updateDoc(userDocRef, {
            gamesPlayed: userData.gamesPlayed,
            totalWins: userData.totalWins,
            totalLosses: userData.totalLosses,
            credits: userData.credits,
            lastLogin: userData.lastLogin
          });
        } catch (error) {
          console.log('Firestore non disponibile, salvando in demo');
        }
      }
      
      // Salva in demo
      this.demoUsers.set(uid, userData);
      localStorage.setItem(`demoUser_${uid}`, JSON.stringify(userData));
    }
  }

  // Carica demo user da localStorage
  loadDemoUserFromStorage(uid: string): UserData | null {
    const saved = localStorage.getItem(`demoUser_${uid}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
    return null;
  }
}
