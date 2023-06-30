import { Component, OnInit } from '@angular/core';
import { HardhatService } from '../services/hardhat.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-existing-contract',
  templateUrl: './existing-contract.component.html',
  styleUrls: ['./existing-contract.component.scss']
})
export class ExistingContractComponent implements OnInit {

  constructor(public hardhatService: HardhatService) {}

  ngOnInit(): void {
    
  }

  onApprove() {
    this.hardhatService.approveEscrowTransfer()
      .pipe(take(1))
      .subscribe(transactionReceipt => {
        console.log('Component received the transaction receipt!', transactionReceipt);
      })

  }


}
