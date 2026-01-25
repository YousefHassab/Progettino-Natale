import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  { path: '', component: LoginComponent }, // <--- La pagina vuota porta al Login
  { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomeModule) },
  { path: 'blackjack', loadChildren: () => import('./blackjack/blackjack.module').then(m => m.BlackjackModule) },
  { path: 'roulette', loadChildren: () => import('./roulette/roulette.module').then(m => m.RouletteModule) },
  { path: 'slot-machine', loadChildren: () => import('./slot-machine/slot-machine.module').then(m => m.SlotMachineModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
