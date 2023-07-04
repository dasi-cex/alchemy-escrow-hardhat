import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { Observable } from 'rxjs';
import { ContractRecord } from 'shared-models/contracts/contract-record.model';
import { ContractProperties } from 'shared-models/contracts/contract-properties.model';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-all-contracts-dialog',
  templateUrl: './all-contracts-dialog.component.html',
  styleUrls: ['./all-contracts-dialog.component.scss']
})
export class AllContractsDialogComponent implements OnInit {

  contracts$!: Observable<ContractRecord[]>;

  constructor(
    private firebaseService: FirebaseService,
    private dialogRef: MatDialogRef<AllContractsDialogComponent>
  ) {}

  ngOnInit(): void {
    this.getAllContracts();
    
  }

  private getAllContracts() {
    this.contracts$ = this.firebaseService.fetchDeployedContracts();
  }

  onSelectContract(contract: ContractProperties) {
    console.log('Selected this contract', contract.address);
    this.dialogRef.close(contract);
  }

}