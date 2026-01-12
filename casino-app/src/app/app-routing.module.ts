import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { 
    path: 'slot-machine', 
    loadChildren: () => import('./slot-machine/slot-machine.module').then(m => m.SlotMachineModule) 
  },
  { 
    path: 'blackjack', 
    loadChildren: () => import('./blackjack/blackjack.module').then(m => m.BlackjackModule) 
  },
  { 
    path: 'roulette', 
    loadChildren: () => import('./roulette/roulette.module').then(m => m.RouletteModule) 
  },
  { 
    path: 'profile', 
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule) 
  },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
