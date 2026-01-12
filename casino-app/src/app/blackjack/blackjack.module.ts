import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlackjackRoutingModule } from './blackjack-routing.module';
import { BlackjackComponent } from './blackjack/blackjack.component';

@NgModule({
  declarations: [
    BlackjackComponent
  ],
  imports: [
    CommonModule,
    BlackjackRoutingModule
  ]
})
export class BlackjackModule { }
