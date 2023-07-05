import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'escrow-hardhat';
  version = '0.0.6';
  showVersion = false;

  onShowVersion() {
    this.showVersion = !this.showVersion;
  }
}
