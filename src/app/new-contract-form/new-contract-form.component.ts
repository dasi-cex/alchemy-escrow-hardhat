import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { HardhatService } from '../services/hardhat.service';
import { Observable, take } from 'rxjs';
import { ethers } from 'ethers';

@Component({
  selector: 'app-new-contract-form',
  templateUrl: './new-contract-form.component.html',
  styleUrls: ['./new-contract-form.component.scss']
})
export class NewContractFormComponent implements OnInit {
  
  contractForm = this.fb.group({
    arbiterAccount: ['', [Validators.required]],
    beneficiaryAccount: ['', [Validators.required]],
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
    const weiValue = ethers.utils.parseEther(this.depositAmount.value.toString());
    console.log('wei value', weiValue);
    this.hardhatService.deployContract(this.arbiterAccount.value, this.beneficiaryAccount.value, weiValue)
      .pipe(take(1))
      .subscribe(transactionReceipt => {
        console.log('Transaction successfully deployed!', transactionReceipt);

      })
  }

  get arbiterAccount() {return this.contractForm.get('arbiterAccount') as AbstractControl<string>}
  get beneficiaryAccount() {return this.contractForm.get('beneficiaryAccount') as AbstractControl<string>}
  get depositAmount() {return this.contractForm.get('depositAmount') as AbstractControl<number>}


}
