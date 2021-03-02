import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

//import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { UiScrollModule } from 'ngx-ui-scroll';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { DetailComponent } from './detail/detail.component';
import { PsaMediaComponent } from './psa-media/psa-media.component';
import { PsaMediumComponent } from './psa-medium/psa-medium.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PsaContentComponent } from './psa-content/psa-content.component';

import { JoinPipe } from './pipes/join.pipe';
import { PsaReleaseListComponent } from './psa-release-list/psa-release-list.component';
import { PsaJobComponent } from './psa-job/psa-job.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DetailComponent,
    PsaMediaComponent,
    PsaMediumComponent,
    PageNotFoundComponent,
    PsaContentComponent,
    JoinPipe,
    PsaReleaseListComponent,
    PsaJobComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MatToolbarModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatButtonModule,
    MatSelectModule,
    MatTabsModule,
    MatExpansionModule,
    BrowserAnimationsModule,
    UiScrollModule,
    //AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [JoinPipe],
  bootstrap: [AppComponent]
})
export class AppModule {}
