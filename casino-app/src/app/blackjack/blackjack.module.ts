import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlackjackComponent } from './blackjack/blackjack.component';

@NgModule({
  declarations: [BlackjackComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: BlackjackComponent }])
  ]
})
export class BlackjackModule { }
