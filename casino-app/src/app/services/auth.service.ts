import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser$: Observable<User | null>;
  userBalance$ = new BehaviorSubject<number>(0);

  constructor(private auth: Auth, private firestore: Firestore) {
    this.currentUser$ = authState(this.auth);

    this.currentUser$.subscribe(async user => {
      if (user) {
        const data = await this.getUserData(user.uid);
        if (data) this.userBalance$.next((data as any).balance || 0);
      }
    });
  }

  async register(email: string, pass: string, name?: string) {
    const res = await createUserWithEmailAndPassword(this.auth, email, pass);
    await setDoc(doc(this.firestore, 'users', res.user.uid), {
      balance: 1000,
      wins: 0,
      losses: 0,
      email: email,
      displayName: name || ''
    });
    return res;
  }

  async login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  async logout() {
    return signOut(this.auth);
  }

  async saveData(balance: number, wins: number, losses: number) {
    const user = this.auth.currentUser;
    if (user) {
      const userRef = doc(this.firestore, 'users', user.uid);
      // Usiamo setDoc con merge: true invece di updateDoc per evitare errori
      await setDoc(userRef, {
        balance: balance,
        wins: wins,
        losses: losses,
        lastUpdate: new Date()
      }, { merge: true });
    }
  }

  async saveBalance(newBalance: number) {
    const user = this.auth.currentUser;
    if (user) {
      const userRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userRef, { 
        balance: newBalance,
        lastUpdate: new Date()
      }, { merge: true });
    }
  }

  private async getUserData(uid: string) {
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    return snap.exists() ? snap.data() : null;
  }
}
