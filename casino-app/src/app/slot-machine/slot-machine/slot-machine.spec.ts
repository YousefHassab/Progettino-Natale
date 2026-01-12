import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotMachine } from './slot-machine';

describe('SlotMachine', () => {
  let component: SlotMachine;
  let fixture: ComponentFixture<SlotMachine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotMachine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotMachine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
