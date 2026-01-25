import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  currentRoute: string = 'home';

  @HostListener('window:hashchange', [''])
  hashChangeHandler(event: HashChangeEvent) {
    console.log('Hash cambiato:', window.location.hash);
    this.updateRoute();
  }

  @HostListener('window:load', [''])
  loadHandler(event: Event) {
    console.log('Pagina caricata');
    this.updateRoute();
  }

  ngOnInit() {
    console.log('AppComponent inizializzato');
    this.updateRoute();
    
    // Logga gli hash changes per debugging
    window.addEventListener('hashchange', (e) => {
      console.log('HashChangeEvent:', e.oldURL, '→', e.newURL);
    });
  }

  updateRoute() {
    const hash = window.location.hash.replace('#', '');
    console.log('Hash corrente:', hash);
    
    switch(hash) {
      case 'blackjack':
        this.currentRoute = 'blackjack';
        break;
      case 'roulette':
        this.currentRoute = 'roulette';
        break;
      case 'slot-machine':
        this.currentRoute = 'slot-machine';
        break;
      case 'login':
        this.currentRoute = 'login';
        break;
      default:
        this.currentRoute = 'home';
    }
    
    console.log('Route selezionata:', this.currentRoute);
    
    // Scrolla in alto quando si cambia route
    window.scrollTo(0, 0);
  }
}
