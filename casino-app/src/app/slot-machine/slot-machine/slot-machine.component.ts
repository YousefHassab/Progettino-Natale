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
  bet = 20; // Puntata fissa per 20 caselle
  spinning = false;
  message = '';
  winAmount = 0;

  // Simboli e Griglia 4 righe x 5 colonne
  symbols = ['💎', '👑', '🍉', '🍇', '🍋', '🍒', '🔔', '7️⃣'];
  grid: string[] = []; // Array piatto di 20 elementi (4x5)

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.userBalance$.subscribe(b => this.balance = b);
    this.resetGrid();
  }

  resetGrid() {
    // Riempi la griglia con simboli a caso all'avvio
    this.grid = Array(20).fill('❓');
  }

  spin() {
    if (this.balance < this.bet) { alert("Saldo insufficiente!"); return; }
    
    this.balance -= this.bet;
    this.spinning = true;
    this.message = "GIRA...";
    this.winAmount = 0;

    // Animazione di caricamento
    let spins = 0;
    const interval = setInterval(() => {
      // Effetto visivo: cambia simboli velocemente
      this.grid = this.grid.map(() => this.getRandomSymbol());
      spins++;
      
      if (spins > 15) { // Dopo un po' ferma
        clearInterval(interval);
        this.finalizeSpin();
      }
    }, 100);
  }

  finalizeSpin() {
    this.spinning = false;
    // Genera la griglia finale
    this.grid = this.grid.map(() => this.getRandomSymbol());
    this.checkWin();
  }

  getRandomSymbol() {
    return this.symbols[Math.floor(Math.random() * this.symbols.length)];
  }

  checkWin() {
    // Conta quanti simboli uguali ci sono
    const counts: {[key: string]: number} = {};
    for (let s of this.grid) {
      counts[s] = (counts[s] || 0) + 1;
    }

    let totalWin = 0;
    let bestSymbol = '';

    // Regola Scatter: 8 o più simboli uguali vincono
    for (let symbol in counts) {
      if (counts[symbol] >= 8) {
        let multiplier = 1;
        if (counts[symbol] >= 10) multiplier = 2;
        if (counts[symbol] >= 12) multiplier = 5;
        
        // Simboli rari valgono di più
        let value = 2; // Frutta base
        if (symbol === '7️⃣') value = 10;
        if (symbol === '👑') value = 25;
        if (symbol === '💎') value = 50;

        totalWin += (value * multiplier);
        bestSymbol = symbol;
      }
    }

    if (totalWin > 0) {
      this.winAmount = totalWin;
      this.balance += totalWin;
      this.message = `VITTORIA! ${totalWin}€ con ${bestSymbol}`;
      this.auth.saveBalance(this.balance);
    } else {
      this.message = "Nessuna fortuna...";
      this.auth.saveBalance(this.balance);
    }
  }

  goHome() { this.router.navigate(['/home']); }
}
