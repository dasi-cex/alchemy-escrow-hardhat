import { Component } from '@angular/core';
import { EvmService } from '../services/evm.service';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss']
})
export class AccountInfoComponent {

  constructor(
    public hardhatService: EvmService,
  ) { }

}
