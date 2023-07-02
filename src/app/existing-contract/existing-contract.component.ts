import { Component, OnInit } from '@angular/core';
import { EvmService } from '../services/evm.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-existing-contract',
  templateUrl: './existing-contract.component.html',
  styleUrls: ['./existing-contract.component.scss']
})
export class ExistingContractComponent implements OnInit {

  constructor(public evmService: EvmService) {}

  ngOnInit(): void {
    
  }

  onApprove() {
    this.evmService.approveEscrowTransfer()
      .pipe(take(1))
      .subscribe();
  }


}
