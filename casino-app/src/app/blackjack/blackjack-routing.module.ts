import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlackjackComponent } from './blackjack/blackjack.component';

const routes: Routes = [
  { path: '', component: BlackjackComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlackjackRoutingModule { }
