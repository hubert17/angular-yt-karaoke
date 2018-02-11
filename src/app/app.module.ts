import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { routes } from './app.router';

import { AppComponent } from './app.component';
import { SharedService } from './shared/lists.service';
import { NwjsService } from './shared/nwjs.service';
import { YoutubeGetVideo } from './shared/youtube.service';
import { SettingsComponent } from './components/youtube-settings.component';
import { SearchComponent } from './components/youtube-search.component';
import { AboutComponent } from './components/youtube-about.component';
import { HistoryComponent } from './components/youtube-history.component';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';

import { YoutubePlayerModule } from 'ngx-youtube-player';
import { environment } from '../environments/environment'

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    ReactiveFormsModule,
    YoutubePlayerModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,      
    routes,
    FormsModule
  ],
  declarations: [
    AppComponent,
    SettingsComponent,
    SearchComponent,
    AboutComponent,
    HistoryComponent
  ],
  bootstrap:    [ AppComponent ],
  providers:    [ YoutubeGetVideo, SharedService, NwjsService ]
})

export class AppModule { }

