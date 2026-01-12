import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotMachineRoutingModule } from './slot-machine-routing.module';
import { SlotMachineComponent } from './slot-machine/slot-machine.component';

@NgModule({
  declarations: [
    SlotMachineComponent
  ],
  imports: [
    CommonModule,
    SlotMachineRoutingModule
  ]
})
export class SlotMachineModule { }
