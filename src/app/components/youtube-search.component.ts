import { Component, OnInit } from '@angular/core';
import { YoutubeGetVideo } from '../shared/youtube.service';
import { AppComponent } from '../app.component';
import { SharedService } from '../shared/lists.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-search',
  templateUrl: 'youtube-search.component.html'
})

export class SearchComponent implements OnInit {

  searchForm: FormGroup;
  thumbnails = false;

  videos: any;
  feedVideos: any;
  channel: any;

  relatedVideoId: string;

  _shared: any;
  _app: any;

  trendingFirst = {
      bannerURL: '',
      video: {
        id: '',
        title: '',
        img: '',
        channelTitle: '',
        stats: {
          views: '',
          likes: '',
          dislikes: ''
        }
      },
      stats: {
        subscribers: '',
        views: '',
        videoCount: ''
      }
  };

  public listGrid = false;

  constructor(
    private youtube: YoutubeGetVideo,
    private shared: SharedService,
    private app: AppComponent
  ) {
    this._shared = shared;
    this._app = app;
  }

  isDesktop=true;
  checkMobile() {
    var isWebkit = 'WebkitAppearance' in document.documentElement.style
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isWebkit) {
        if (isMobile) {
          console.log('IsMobile');
          return this.isDesktop=false;
        }
    }
    return this.isDesktop=true;
  }

  ngOnInit() {
    //console.log('search');
    this.checkMobile();
    this.setSettings();
    this.searchFunction();
    this.getFeedVideos();
  }

  searchFunction() {
    this.searchForm = new FormGroup({
      searchInput: new FormControl('', [Validators.required, Validators.minLength(2)])
    });

    this.searchForm.valueChanges.subscribe((form) => {
        this.youtube.searchVideo(form.searchInput).subscribe(
          result => {
            if (!this.searchForm.invalid) {
              this.videos = result.items;              
              this._shared.lastSearchedVideos = result.items;              
            } else {
              this.getRelatedVideos();
            }
          },
          error => {
            console.log('error on search');
          }
        );
    });
  }

  setSettings() {
    this._shared.getSettings().subscribe(data => {
        this.thumbnails = data.form_settings[0].value;
        this.listGrid = data.form_settings[1].value;
    });
  }

  getFeedVideos() {
      this._shared.getFeed().subscribe(data => {
          this.feedVideos = data;
          this.getChannelTrending(this.feedVideos[0].snippet.channelId);
      });
  }

  getChannelTrending(query: any) {
    this._shared.getChannel(query).subscribe(data => {
        this.feedVideos = this._shared.feedVideos;
        this.channel = this._shared.channel;
        this.trendingFirst.video.id = this.feedVideos[0].id;
        this.trendingFirst.video.title = this.feedVideos[0].snippet.title;
        this.trendingFirst.video.img = this.feedVideos[0].snippet.thumbnails.medium.url;
        this.trendingFirst.bannerURL = this.feedVideos[0].snippet.thumbnails.high.url;
        this.trendingFirst.video.channelTitle = this.channel.items[0].snippet.title;
    });
}

  clearSearch() {
    this.searchForm.reset();
    document.getElementById("input-search").focus();    
  }

  onSubmit(event: Event) {
    event.preventDefault();
  }

  onClickVideo(event: Event, i: any, list: number) {
    if (list === 1) {
      this._app.getVideo(this.videos[i]);
    } else if (list === 3) {
      this._app.getVideo(this.feedVideos[i]);
    }
  }

  onCopyVideoItemLink(i: number, list: number) {
      this._app.onCopyVideoItemLink(i, list);
  }

  addPlaylistItem(i: number, list: number) {
      this._app.addPlaylistItem(i, list);    
      if(this.videos) {
        this.relatedVideoId = this.videos[i].id.videoId; 
      }     
  }

  getRelatedVideos() {
    if(!this.relatedVideoId) {
      this.relatedVideoId = this.feedVideos[0].id.videoId; 
    }  
    this.youtube.relatedVideos(this.relatedVideoId).subscribe(
        result => {
          this.videos = result.items;              
          this._shared.lastSearchedVideos = result.items;   
        },
        error => {
          console.log('error on related videos');
        }
      );
  }
}
