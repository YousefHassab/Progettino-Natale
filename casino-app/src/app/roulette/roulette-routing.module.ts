import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouletteComponent } from './roulette/roulette.component';

const routes: Routes = [
  { path: '', component: RouletteComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RouletteRoutingModule { }
