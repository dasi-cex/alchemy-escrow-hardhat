import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExistingContractComponent } from './existing-contract.component';

describe('ExistingContractComponent', () => {
  let component: ExistingContractComponent;
  let fixture: ComponentFixture<ExistingContractComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExistingContractComponent]
    });
    fixture = TestBed.createComponent(ExistingContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
