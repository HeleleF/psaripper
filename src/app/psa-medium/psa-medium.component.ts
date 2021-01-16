import { Component, Input } from '@angular/core';
import { PSAMedium } from '../model/PSAMedium.interface';

@Component({
  selector: 'app-psa-medium',
  templateUrl: './psa-medium.component.html',
  styleUrls: ['./psa-medium.component.scss']
})
export class PsaMediumComponent {

  @Input() content: PSAMedium;
}
