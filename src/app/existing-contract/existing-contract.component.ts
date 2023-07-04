import { Component, OnInit } from '@angular/core';
import { EvmService } from '../services/evm.service';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { AllContractsDialogComponent } from '../all-contracts-dialog/all-contracts-dialog.component';
import { ContractProperties } from 'shared-models/contracts/contract-properties.model';

@Component({
  selector: 'app-existing-contract',
  templateUrl: './existing-contract.component.html',
  styleUrls: ['./existing-contract.component.scss']
})
export class ExistingContractComponent implements OnInit {

  constructor(
    public evmService: EvmService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    
  }

  async onApprove() {
    await this.evmService.approveEscrowTransfer()
      .catch(error => console.log('Error in service', error));
  }

  onViewAllContracts() {
    const dialogOptions: MatDialogConfig = {
      minHeight: 500,
      minWidth: 360
    }
    const dialogRef: MatDialogRef<AllContractsDialogComponent, ContractProperties> = this.dialog.open(AllContractsDialogComponent, dialogOptions);
    dialogRef.afterClosed().subscribe(contract => {
      if (contract) {
        this.evmService.fetchContractProperties(contract.address);  
      }
    });
  }


}
