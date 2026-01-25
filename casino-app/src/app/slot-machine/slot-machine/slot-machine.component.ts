import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-slot-machine',
  templateUrl: './slot-machine.component.html',
  styleUrls: ['./slot-machine.component.css']
})
export class SlotMachineComponent implements OnInit {
  balance: number = 0;
  
  // OPZIONI DI PUNTATA: 20, 50, 100
  betOptions = [20, 50, 100];
  bet = 20; // Puntata selezionata di default
  
  spinning = false;
  message = '';
  winAmount = 0;

  // Simboli e Griglia 4 righe x 5 colonne
  symbols = ['💎', '👑', '🍉', '🍇', '🍋', '🍒', '🔔', '7️⃣'];
  grid: string[] = [];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.userBalance$.subscribe(b => this.balance = b);
    this.resetGrid();
  }

  // Funzione per cambiare la puntata
  setBet(amount: number) {
    if (this.spinning) return; // Non cambiare mentre gira
    this.bet = amount;
    this.message = `Puntata impostata a ${amount}€`;
  }

  resetGrid() {
    this.grid = Array(20).fill('❓');
  }

  spin() {
    if (this.balance < this.bet) { 
      this.message = "Saldo insufficiente!"; 
      return; 
    }
    
    this.balance -= this.bet;
    this.spinning = true;
    this.message = "BUONA FORTUNA!";
    this.winAmount = 0;

    let spins = 0;
    const interval = setInterval(() => {
      this.grid = this.grid.map(() => this.getRandomSymbol());
      spins++;
      
      if (spins > 15) {
        clearInterval(interval);
        this.finalizeSpin();
      }
    }, 100);
  }

  finalizeSpin() {
    this.spinning = false;
    this.grid = this.grid.map(() => this.getRandomSymbol());
    this.checkWin();
  }

  getRandomSymbol() {
    return this.symbols[Math.floor(Math.random() * this.symbols.length)];
  }

  checkWin() {
    const counts: {[key: string]: number} = {};
    for (let s of this.grid) {
      counts[s] = (counts[s] || 0) + 1;
    }

    let totalWin = 0;
    let bestSymbol = '';

    // Regola Scatter: 8+ simboli vincono
    // Il moltiplicatore si basa sulla puntata attuale (this.bet)
    const baseBetMultiplier = this.bet / 20; // 1x per 20€, 2.5x per 50€, 5x per 100€

    for (let symbol in counts) {
      if (counts[symbol] >= 8) {
        let multiplier = 1;
        if (counts[symbol] >= 10) multiplier = 2;
        if (counts[symbol] >= 12) multiplier = 5;
        
        let value = 2; 
        if (symbol === '7️⃣') value = 10;
        if (symbol === '👑') value = 25;
        if (symbol === '💎') value = 50;

        // Formula: Valore Simbolo * Quantità * Moltiplicatore Puntata
        totalWin += (value * multiplier * baseBetMultiplier);
        bestSymbol = symbol;
      }
    }

    if (totalWin > 0) {
      this.winAmount = Math.floor(totalWin);
      this.balance += this.winAmount;
      this.message = `VITTORIA! ${this.winAmount}€`;
      this.auth.saveBalance(this.balance);
    } else {
      this.message = "Riprova...";
      this.auth.saveBalance(this.balance);
    }
  }

  goHome() { this.router.navigate(['/home']); }
}
