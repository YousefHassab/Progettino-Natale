import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface Bet {
  type: 'number' | 'color' | 'even_odd' | 'half' | 'dozen' | 'column';
  value: any;
  amount: number;
}

@Component({
  selector: 'app-roulette',
  templateUrl: './roulette.component.html',
  styleUrls: ['./roulette.component.css']
})
export class RouletteComponent implements OnInit {
  balance: number = 0;
  numbers: number[] = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  
  // Stato gioco
  lastNumber: number | null = null;
  isSpinning = false;
  lastWin = 0;

  // Gestione Puntate Multiple
  selectedChip = 10;
  activeBets: Bet[] = [];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.userBalance$.subscribe(b => this.balance = b);
  }

  // Seleziona il valore della fiche da piazzare
  selectChip(val: number) {
    this.selectedChip = val;
  }

  // Piazza una puntata (puoi farne quante ne vuoi)
  placeBet(type: any, value: any) {
    if (this.isSpinning) return;
    if (this.balance < this.selectedChip) {
      alert("Saldo insufficiente!");
      return;
    }

    // Togli i soldi dal saldo (li rimettiamo se vinci)
    this.balance -= this.selectedChip;
    
    // Aggiungi la puntata alla lista
    this.activeBets.push({
      type: type,
      value: value,
      amount: this.selectedChip
    });
  }

  // Gira la ruota
  spin() {
    if (this.activeBets.length === 0) {
      alert("Piazza almeno una puntata!");
      return;
    }
    
    this.isSpinning = true;
    this.lastWin = 0;
    this.lastNumber = null;

    // Tempo di rotazione (3 secondi)
    setTimeout(() => {
      // Estrai numero casuale
      this.lastNumber = Math.floor(Math.random() * 37);
      
      this.calculateWinnings(this.lastNumber);
      this.isSpinning = false;
    }, 3000);
  }

  calculateWinnings(n: number) {
    let totalWin = 0;
    const isRed = this.checkRed(n);
    const isEven = n !== 0 && n % 2 === 0;
    const isOdd = n !== 0 && n % 2 !== 0;
    const isLow = n >= 1 && n <= 18;
    const isHigh = n >= 19 && n <= 36;

    // Controlla ogni singola puntata
    for (let bet of this.activeBets) {
      let winMultiplier = 0;

      switch (bet.type) {
        case 'number':
          if (bet.value === n) winMultiplier = 36; // Paga 35:1 + puntata
          break;
        case 'color':
          if ((bet.value === 'red' && isRed) || (bet.value === 'black' && !isRed && n !== 0)) winMultiplier = 2;
          break;
        case 'even_odd':
          if ((bet.value === 'even' && isEven) || (bet.value === 'odd' && isOdd)) winMultiplier = 2;
          break;
        case 'half':
          if ((bet.value === 'low' && isLow) || (bet.value === 'high' && isHigh)) winMultiplier = 2;
          break;
        case 'dozen': // 1-12, 13-24, 25-36
          if (n !== 0) {
            if (bet.value === 1 && n <= 12) winMultiplier = 3;
            if (bet.value === 2 && n > 12 && n <= 24) winMultiplier = 3;
            if (bet.value === 3 && n > 24) winMultiplier = 3;
          }
          break;
      }

      totalWin += bet.amount * winMultiplier;
    }

    if (totalWin > 0) {
      this.balance += totalWin;
      this.lastWin = totalWin;
      this.auth.saveBalance(this.balance);
    } else {
      this.auth.saveBalance(this.balance); // Salva il saldo scalato
    }
    
    // Pulisci il tavolo
    this.activeBets = [];
  }

  // Helper per la grafica: Conta quanto ho puntato su una specifica cella
  getBetAmountOnCell(type: string, value: any): number {
    return this.activeBets
      .filter(b => b.type === type && b.value === value)
      .reduce((sum, b) => sum + b.amount, 0);
  }

  // Helper per il rosso
  checkRed(n: number): boolean {
    return [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
  }
  
  // Totale puntato adesso
  getCurrentTotalBet(): number {
    return this.activeBets.reduce((sum, b) => sum + b.amount, 0);
  }

  clearBets() {
    // Restituisci i soldi e pulisci
    const total = this.getCurrentTotalBet();
    this.balance += total;
    this.activeBets = [];
  }

  goHome() { this.router.navigate(['/home']); }
}
