import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs } from '@angular/fire/firestore';

export interface GameTransaction {
  uid: string;
  gameType: 'slotMachine' | 'blackjack' | 'roulette';
  betAmount: number;
  winAmount: number;
  result: 'win' | 'loss' | 'draw';
  timestamp: Date;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private demoTransactions: GameTransaction[] = [];

  constructor(private firestore: Firestore) {}

  // Registra una transazione di gioco
  async recordTransaction(transaction: GameTransaction): Promise<string> {
    // Prima prova Firestore
    if (this.firestore) {
      try {
        const transactionsRef = collection(this.firestore, 'gameTransactions');
        const docRef = await addDoc(transactionsRef, {
          ...transaction,
          timestamp: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.log('Firestore non disponibile, salvando in demo');
      }
    }
    
    // Demo mode
    this.demoTransactions.push({
      ...transaction,
      timestamp: new Date()
    });
    
    // Limita a 100 transazioni per performance
    if (this.demoTransactions.length > 100) {
      this.demoTransactions = this.demoTransactions.slice(-100);
    }
    
    // Salva in localStorage
    localStorage.setItem('demoTransactions', JSON.stringify(this.demoTransactions));
    
    return 'demo-' + Date.now();
  }

  // Ottieni la cronologia delle transazioni di un utente
  async getUserTransactions(uid: string, limit: number = 10): Promise<GameTransaction[]> {
    // Carica da localStorage se disponibile
    const saved = localStorage.getItem('demoTransactions');
    if (saved) {
      try {
        this.demoTransactions = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading transactions', e);
      }
    }
    
    // Filtra per uid e ordina per timestamp
    const userTransactions = this.demoTransactions
      .filter(t => t.uid === uid)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return userTransactions;
  }

  // LOGICA AGGIORNATA PER SLOT MACHINE 4x5
  spinSlotMachine(bet: number): { symbols: string[], winAmount: number, winType: string } {
    const symbols = ['🍒', '🍋', '🍊', '⭐', '🔔', '7️⃣'];
    
    // Genera 20 simboli (4 righe x 5 colonne)
    const resultSymbols = Array.from({ length: 20 }, () => 
      symbols[Math.floor(Math.random() * symbols.length)]
    );

    let totalWin = 0;
    let winType = 'nessuna vincita';

    // Definiamo le 4 linee orizzontali (ognuna da 5 simboli)
    const paylines = [
      [0, 1, 2, 3, 4],    // Riga 1
      [5, 6, 7, 8, 9],    // Riga 2
      [10, 11, 12, 13, 14], // Riga 3
      [15, 16, 17, 18, 19]  // Riga 4
    ];

    paylines.forEach(line => {
      const s1 = resultSymbols[line[0]];
      const s2 = resultSymbols[line[1]];
      const s3 = resultSymbols[line[2]];

      // Controlla se i primi 3 simboli della riga sono uguali (simile alla logica originale)
      if (s1 === s2 && s2 === s3) {
        if (s1 === '7️⃣') {
          totalWin += bet * 50; // Jackpot ridotto leggermente per compensare le 4 righe
          winType = 'JACKPOT 777!';
        } else if (s1 === '⭐') {
          totalWin += bet * 25;
          winType = 'Tre stelle!';
        } else {
          totalWin += bet * 5;
          winType = 'Tre simboli uguali!';
        }
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        // Due simboli uguali nella riga
        totalWin += bet * 1; 
        if (winType === 'nessuna vincita') winType = 'Due simboli uguali!';
      }
    });

    return {
      symbols: resultSymbols,
      winAmount: totalWin,
      winType: totalWin > 0 ? winType : 'nessuna vincita'
    };
  }

  // Logica per il blackjack (semplificata)
  playBlackjack(bet: number, userAction: 'hit' | 'stand'): { 
    userCards: number[], 
    dealerCards: number[], 
    userTotal: number, 
    dealerTotal: number, 
    result: 'win' | 'loss' | 'draw',
    winAmount: number 
  } {
    // Distribuisci carte iniziali
    let userCards = [this.drawCard(), this.drawCard()];
    let dealerCards = [this.drawCard(), this.drawCard()];

    let userTotal = this.calculateHandTotal(userCards);
    let dealerTotal = this.calculateHandTotal(dealerCards);

    let result: 'win' | 'loss' | 'draw' = 'draw';
    let winAmount = 0;

    // Logica del gioco
    if (userAction === 'hit') {
      userCards.push(this.drawCard());
      userTotal = this.calculateHandTotal(userCards);

      if (userTotal > 21) {
        result = 'loss'; // Sballato
        winAmount = 0;
      }
    }

    // Dealer gioca
    if (result !== 'loss') {
      while (dealerTotal < 17) {
        dealerCards.push(this.drawCard());
        dealerTotal = this.calculateHandTotal(dealerCards);
      }

      // Determina il vincitore
      if (dealerTotal > 21 || userTotal > dealerTotal) {
        result = 'win';
        winAmount = bet * 2; // Vince il doppio della puntata
      } else if (userTotal < dealerTotal) {
        result = 'loss';
        winAmount = 0;
      } else {
        result = 'draw';
        winAmount = bet; // Restituisce la puntata
      }
    }

    return {
      userCards,
      dealerCards,
      userTotal,
      dealerTotal,
      result,
      winAmount
    };
  }

  // Logica per la roulette (base)
  spinRoulette(bet: number, betType: 'number' | 'color' | 'evenOdd', betValue: any): { 
    winningNumber: number, 
    winningColor: 'red' | 'black' | 'green',
    result: 'win' | 'loss',
    winAmount: number 
  } {
    // Genera numero vincente 0-36
    const winningNumber = Math.floor(Math.random() * 37);
    let winningColor: 'red' | 'black' | 'green' = 'green'; // 0 è verde
    
    if (winningNumber !== 0) {
      winningColor = (winningNumber % 2 === 0) ? 'black' : 'red';
    }

    let winAmount = 0;
    let win = false;

    // Controlla la vincita in base al tipo di puntata
    switch (betType) {
      case 'number':
        win = (betValue === winningNumber);
        if (win) winAmount = bet * 35; // Paga 35:1
        break;
      
      case 'color':
        win = (betValue === winningColor);
        if (win) winAmount = bet * 2; // Paga 2:1
        break;
      
      case 'evenOdd':
        if (winningNumber !== 0) {
          const isEven = winningNumber % 2 === 0;
          win = (betValue === 'even' && isEven) || (betValue === 'odd' && !isEven);
          if (win) winAmount = bet * 2; // Paga 2:1
        }
        break;
    }

    return {
      winningNumber,
      winningColor,
      result: win ? 'win' : 'loss',
      winAmount
    };
  }

  // Helper functions
  private drawCard(): number {
    return Math.min(Math.floor(Math.random() * 11) + 1, 10); // Carte 1-10
  }

  private calculateHandTotal(cards: number[]): number {
    let total = cards.reduce((sum, card) => sum + card, 0);
    
    // Gestisci l'asso (qui semplificato)
    if (cards.includes(1) && total <= 11) {
      total += 10; // Asso vale 11
    }
    
    return total;
  }
}