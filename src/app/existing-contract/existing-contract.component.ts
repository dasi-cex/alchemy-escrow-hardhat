import { Component, OnInit, signal } from '@angular/core';
import { HardhatService } from '../services/hardhat.service';
import { catchError, take, throwError } from 'rxjs';

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
      .subscribe();
  }


}
