import { Component, Input, OnInit } from '@angular/core';
import { PSAJobData } from '../model/PSAJobData.interface';

@Component({
  selector: 'app-psa-job',
  templateUrl: './psa-job.component.html',
  styleUrls: ['./psa-job.component.scss']
})
export class PsaJobComponent implements OnInit {

  @Input() jobIndex!: number;
  @Input() jobData!: PSAJobData;

  constructor() { }
  

  ngOnInit(): void {
  }

}
