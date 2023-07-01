import { Component, OnInit, effect } from '@angular/core';
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
    public hardhatService: HardhatService
  ) {
    this.monitorContractState(); // Effects must be called from the constructor
  }

  ngOnInit(): void {
  }

  // TODO: Update smart contract to ensure arbiter can't be the deployer

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

  onReset() {
    this.hardhatService.resetContractState();
    // Reset and renable form if reset is requested
    this.contractForm.reset();
    this.contractForm.enable();
  }

  private monitorContractState() {
    // Effect monitors changes in any signals used within it
    effect(() => {
      // Disable form if deployed successfully
      if (this.hardhatService.deployContractSuccessful$()) {
        console.log('Disabling fields. Contract deployment status:', this.hardhatService.deployContractSuccessful$());
        this.contractForm.disable();
      }

      // Disable form while deploying
      if (this.hardhatService.deployContractProcessing$() && !this.hardhatService.deployContractSuccessful$()) {
        this.contractForm.disable();
      } 

      // Enable form if error
      if (this.hardhatService.deployContractError$()) {
        this.contractForm.enable();
      }

    })
    
  }

  // private disableForm() {
    
  //   this.arbiterAccount.disable();
  //   this.beneficiaryAccount.disable();
  //   this.depositAmount.disable();
  // }

  get arbiterAccount() {return this.contractForm.get('arbiterAccount') as AbstractControl<string>}
  get beneficiaryAccount() {return this.contractForm.get('beneficiaryAccount') as AbstractControl<string>}
  get depositAmount() {return this.contractForm.get('depositAmount') as AbstractControl<number>}


}
