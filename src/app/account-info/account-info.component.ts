import { Component } from '@angular/core';
import { HardhatService } from '../services/hardhat.service';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss']
})
export class AccountInfoComponent {

  constructor(
    public hardhatService: HardhatService,
  ) { }

}
