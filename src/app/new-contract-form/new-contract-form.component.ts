import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HardhatService } from '../services/hardhat.service';
import { Observable, from, map, switchMap, take, tap } from 'rxjs';

@Component({
  selector: 'app-new-contract-form',
  templateUrl: './new-contract-form.component.html',
  styleUrls: ['./new-contract-form.component.scss']
})
export class NewContractFormComponent implements OnInit {
  
  contractForm = this.fb.group({
    arbiterAddress: ['', [Validators.required]],
    beneficiaryAddress: ['', [Validators.required]],
    depositAmount: [0, [Validators.required, Validators.min(1)]]
  });

  currentWalletAddres!: Observable<string>;

  
  constructor(
    private fb: FormBuilder,
    private hardhatService: HardhatService
  ) {}

  ngOnInit(): void {
    
  }


  onSubmit() {
    console.log('Form values', this.contractForm.value);
  }

  get arbiterAddress() {return this.contractForm.value.arbiterAddress}
  get beneficiaryAddress() {return this.contractForm.value.beneficiaryAddress}
  get depositAmount() {return this.contractForm.value.depositAmount}


}
