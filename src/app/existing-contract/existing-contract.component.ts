import { Component, OnInit } from '@angular/core';
import { HardhatService } from '../services/hardhat.service';

@Component({
  selector: 'app-existing-contract',
  templateUrl: './existing-contract.component.html',
  styleUrls: ['./existing-contract.component.scss']
})
export class ExistingContractComponent implements OnInit {

  constructor(public hardhatService: HardhatService) {}

  ngOnInit(): void {
    
  }


}
