import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllContractsDialogComponent } from './all-contracts-dialog.component';

describe('AllContractsDialogComponent', () => {
  let component: AllContractsDialogComponent;
  let fixture: ComponentFixture<AllContractsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AllContractsDialogComponent]
    });
    fixture = TestBed.createComponent(AllContractsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
