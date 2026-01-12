import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Pulisci localStorage solo per debugging
if (!environment.production) {
  // Mantieni solo alcune chiavi
  const keysToKeep = ['demoUser', 'demoTransactions'];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.some(k => key.startsWith(k))) {
      localStorage.removeItem(key);
    }
  }
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
