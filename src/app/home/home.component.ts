import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { PSAJobData, PSAJobStatus } from '../model/PSAJobData.interface';
import { JobService } from '../services/job.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  jobs$: Observable<PSAJobData[]>;

  constructor(private js: JobService) {
    this.jobs$ = this.js.onJobsChanged();
  }

  ngOnInit(): void {}

  addNewJob(): void {
  }

  updateJob(): void {

  }

}
