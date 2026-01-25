import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SlotMachineComponent } from './slot-machine/slot-machine.component';

@NgModule({
  declarations: [SlotMachineComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: SlotMachineComponent }])
  ]
})
export class SlotMachineModule { }
