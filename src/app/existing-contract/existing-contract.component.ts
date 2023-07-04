import { Component, OnInit } from '@angular/core';
import { EvmService } from '../services/evm.service';

@Component({
  selector: 'app-existing-contract',
  templateUrl: './existing-contract.component.html',
  styleUrls: ['./existing-contract.component.scss']
})
export class ExistingContractComponent implements OnInit {

  constructor(public evmService: EvmService) {}

  ngOnInit(): void {
    
  }

  async onApprove() {

    await this.evmService.approveEscrowTransfer()
      .catch(error => console.log('Error in service', error));

  }


}
