import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { YoutubeGetVideo } from './shared/youtube.service';
import { SharedService } from './shared/lists.service';
import { NwjsService } from './shared/nwjs.service';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';


@Component({
  selector: 'app-yt',
  templateUrl: 'app.component.html'
})

export class AppComponent implements OnInit {
  @ViewChild('playlistContainer') private myScrollContainer: ElementRef;
  @ViewChild('videoItemIDvalue') private videoItemIDvalue: ElementRef;

  AppTitle = "YoutubeK by Gabs";
  roomId= 'public';

  notify: any;
  nw: any;
  videoRangePercent = 0;

  relatedVideos: Array<any>;
  feedVideos: Array<any>;
  playlistVideos: Array<any> = [];
  currentVideoObject: Array<any> = [];

  thumbnails = true;
  darkMode = true;
  menuActive = false;

  modal = false;
  modalPlaylist = false;
  modalExportPlaylist = false;
  modalPlaylistItem: number;
  UsageModalDesktop = false;
  UsageModalMobile = false;

  playlistPrefill = true;
  currentPlaylistItem: number;
  displayVideoPlayer = true;
  repeatMode = true;
  regionCode: string;
  shareLink = '';

  player: YT.Player;

  currentVideo = {
      id: '',
      title: '',
      channelTitle: '',
      stats: {
        likes: '',
        dislikes: '',
        views: ''
      }
  };

  currentState = -1;
  currentMuteState = false;

  videoRangeMouseActive = false;
  volumeRangeMouseActive = false;
  videoRangeTimer: any;
  videoCurRange = 0;
  videoMaxRange = 0;

  videoCurFull = '00:00:00';
  videoMaxFull = '00:00:00';

  videoCurVolume = -1;

  _shared: any;
  _nwjs: any;

  loading = true;
  maximized = false;

  // Firebase
  fsVideosCol: AngularFirestoreCollection<any>;
  fsVideos: Observable<any[]>;
  fsVideoStats: AngularFirestoreCollection<any>;
  fsVideosCurrent: Observable<any>;
  fsVideosNext: Observable<any>;
  fsVideosPlaybackState: Observable<any>;
  subscription : Subscription;

  constructor(
    private youtube: YoutubeGetVideo,
    private shared: SharedService,
    private nwjs: NwjsService,
    private afs: AngularFirestore,
    private titleService: Title
  ) {
    this._shared = shared;
    this._nwjs = nwjs;
    this.notify = this._shared.notify;
  }

  isDesktop=true;
  checkMobile() {
    var isWebkit = 'WebkitAppearance' in document.documentElement.style
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (true)  //if (isWebkit) 
    {
        if (isMobile) {
          console.log('IsMobile');
          return this.isDesktop=false;
        }
    }
    return this.isDesktop=true;
  }

  ngOnInit() {
    this.checkMobile();
    var roomId = (new URL(location.href)).searchParams.get("roomId");
    if(roomId) {
      this.roomId = roomId;
    }

      this._nwjs.init().subscribe((data) => {
        if (typeof data !== 'undefined') {
          this.nw = data;
          this.initNWJS();
          this.initShortcut();
        }
      });
      this.preventOldSettings();
      this.setSettings();
      this.getFeedVideos();
      this.getFsPlaylist();

      this.modal = true;
      if(this.isDesktop) {
        this.UsageModalDesktop= true;
      } else {
        this.UsageModalMobile = true;
      }
  }

  getFsPlaylist() {   
    this.fsVideosCol = this.afs.collection('karaoke', ref => {        
      return ref.where('roomId', '==', this.roomId);
    });      
    this.fsVideos = this.fsVideosCol.valueChanges();              
    this.fsVideos.subscribe(data => {
      //console.log(JSON.stringify(data[0]));
      this.playlistVideos = data;
    });

    this.fsVideoStats = this.afs.collection<any>('karaokeStats');
    this.fsVideosCurrent = this.afs.doc('karaokeStats/curr-' + this.roomId).valueChanges();
    this.fsVideosNext = this.afs.doc('karaokeStats/next-' + this.roomId).valueChanges(); 
    this.fsVideosPlaybackState = this.afs.doc('karaokeStats/playback-' + this.roomId).valueChanges(); 
  }


  // ---------------- Init player ----------------

  savePlayer(player) {
      /*let playerSrc = player.a.src;
      if (playerSrc.indexOf('origin') > 0) {
        const playerSrcOrigin = playerSrc.substr(playerSrc.indexOf('origin'));
        const playerOrigin = playerSrcOrigin.substr(0, playerSrcOrigin.indexOf('&'));
        const playerNewSrc = playerSrc.replace(playerOrigin, 'origin=http%3A%2F%2Fgoogle.com');
        player.a.src = playerNewSrc;
      }
      console.log(player);*/
      this.player = player;
  }

  playerVars() {
    const playerVars = {
      'enablejsapi': 1,
      'controls': 1,
      'disablekb': 0,
      'showinfo': 0,
      'playsinline': 1,
      'autoplay': 0,
      'loop': 0,
      'origin': 'https://www.youtube.com',
      'rel': 0
    };
    return playerVars;
  }

  getFeedVideos() {
    this._shared.getFeed().subscribe(data => {
      this.feedVideos = data;
      if (!this.currentVideo.id) {
        this.setDefaultPlayer();
      }
    });
  }

  setCurrentVideoObject(data: any, fromMe = true) {
    if(data) {
      //console.log(JSON.stringify(data));
      this.currentVideoObject = [];
      this.currentVideoObject.push(data);  
      if(fromMe) {
        this.fsVideoStats.doc('curr-' + this.roomId).set(data);           
      }
    }
        
  }

  setDefaultPlayer() {
    // this.feedVideos = this._shared.feedVideos;
    // this.setCurrentVideoObject(this.feedVideos[0]);
    // this.currentVideo.id = this.feedVideos[0].id;
    // this.currentVideo.title = this.feedVideos[0].snippet.title;
    // this.currentVideo.stats.likes = this.feedVideos[0].statistics.likeCount;
    // this.currentVideo.stats.dislikes = this.feedVideos[0].statistics.dislikeCount;
    // this.currentVideo.stats.views = this.feedVideos[0].statistics.viewCount;
    // this.shareLink = 'https://youtu.be/' + this.currentVideo.id;
    // this.getRelatedVideos();
    // this.findPlaylistItem();
  }

  launchIntoFullscreen(element) {
    if(element.requestFullscreen) {
      element.requestFullscreen();
    } else if(element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if(element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if(element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }

  onStateChange(event) {
    this.currentState = event.data;
    this.videoMaxRange = this.player.getDuration();
    this.videoCurVolume = this.player.getVolume();

    if (this.currentState === 1) {
      this.videoMaxFull = this.timeFormat(this.videoMaxRange);
      this.currentMuteState = this.player.isMuted();
      this.startRange();
    } else {
      this.stopRange();
    }

    if (this.currentState === 0) {
      this.stopRange();
      if (this.repeatMode) {
        if (this.playlistVideos.length) {
          this.findPlaylistItem();
          if (this.currentPlaylistItem < 0) {
            this.playPlaylistItem('next', this.currentPlaylistItem);
          } else {
            this.playPlaylistItem('next', this.currentPlaylistItem);
          }
          if (this.playlistVideos.length === 1) {
            this.player.playVideo();
          }
        } else {
          this.player.playVideo();
        }
      }
    }
  }

  startRange() {
    this.stopRange();
    if (this.currentState && this.playlistVideos.length > 0) {
      this.videoRangeTimer = setInterval(() => {        
        this.videoCurRange = this.player.getCurrentTime();
        this.videoCurFull = this.timeFormat(this.videoCurRange);
        this.videoRangePercent = (this.videoCurRange / this.videoMaxRange) * 100;        
        var videoRangePercent = Math.floor(this.videoRangePercent);
        //console.log('Now playing at ' +  videoRangePercent);
        var currTitle = this.playlistVideos[this.currentPlaylistItem].snippet.title;
        var msgCurr = currTitle ? currTitle : this.AppTitle; 
        var nx = 'next-' + this.roomId;
        if (this.currentPlaylistItem < this.playlistVideos.length - 1) {
          var msgNext = this.playlistVideos[this.currentPlaylistItem+1].snippet.title;
          if(this.videoRangePercent < 1) {
            this.fsVideoStats.doc(nx).set({"msgKar": "Loading karaoke..."});
          } else if (videoRangePercent == 2) {
            this.fsVideoStats.doc(nx).set({"msgKar": msgCurr});
          } else if (videoRangePercent == 5) {
            this.fsVideoStats.doc(nx).set({"msgKar": "Have fun singing!"});
          } else if (videoRangePercent == 50) {
            this.fsVideoStats.doc(nx).set({"msgKar": "Are you having fun?!?"});
          } else if (videoRangePercent == 52) {
            this.fsVideoStats.doc(nx).set({"msgKar": "Coming your way..."});
          } else if (videoRangePercent == 53) {
            this.fsVideoStats.doc(nx).set({"msgKar": msgNext});
          } else if (videoRangePercent == 90) {
            this.fsVideoStats.doc(nx).set({"msgKar": "Up Next..."});
          } else if (videoRangePercent == 91) {
            this.fsVideoStats.doc(nx).set({"msgKar": msgNext});
          } 
        } else {
          this.fsVideoStats.doc(nx).set({"msgKar": "Last song in the playlist."});    
        }   
      }, 1000);
    } else {
      this.player.stopVideo();
    }
  }

  stopRange() {
     clearInterval(this.videoRangeTimer);
  }

  // ---------------- Playlist settings ----------------

  playlistInit() {
      console.log('RoomId: ' + this.roomId);      
      this.findPlaylistItem();

      this.fsVideosCurrent.subscribe(data => {
        this.getVideoFs(data)                 
      }); 

      this.fsVideosPlaybackState.subscribe(data => {   
        console.log('From remote:' + data.state);  
        if (data.state === "pause") {
          console.log("Remote State: PAUSE video");
          if(this.isDesktop) {
            this.player.pauseVideo();
          }  else {
            this.currentState = 0;
          }          
        } else if (data.state === "play"){
          console.log("Remote State: PLAY video");
          if(this.isDesktop) {
            this.player.playVideo(); 
            this.launchIntoFullscreen(this.player);           
          } else {
            this.currentState = 1;
          }           
        }                                           
      });          

      this.fsVideosNext.subscribe(data => {     
        //console.log(JSON.stringify(data));
        if(data) {
          this.titleService.setTitle(data.msgKar);  
        }         
        setTimeout(() => {
          this.titleService.setTitle(this.AppTitle); 
        }, 30000);                                   
      });          
  }

  findPlaylistItem(fromMe = true) {
    let playlistItem;
    if (typeof this.currentVideoObject[0].id.videoId !== 'undefined') {
      playlistItem = this.playlistVideos.find(item => item.id.videoId === this.currentVideoObject[0].id.videoId);
    } else {
      playlistItem = this.playlistVideos.find(item => item.id === this.currentVideoObject[0].id);
    }  
    this.currentPlaylistItem = this.playlistVideos.indexOf(playlistItem);
    //console.log("currentPlayItem=" + this.currentPlaylistItem);
  }

  playPlaylistItem(direction: string, i: number) {
    if (direction === 'next') {
      if (i < this.playlistVideos.length) {
        i += 1;
      }
      if (i >= this.playlistVideos.length) {
        i = 0;
      }
    }
    if (direction === 'prev') {
      if (i === 0 || i < 0) {
        i = this.playlistVideos.length - 1;
      } else {
        i -= 1;
      }
    }
    if (this.playlistVideos.length > 0) {
      this.getVideo(this.playlistVideos[i]);
    } else {
      this._shared.triggerNotify('Playlist is empty');
      this.updateNotify();
    }
  }

  removePlaylistItem(i: number, seq) {
      this._shared.deleteKaraokeFs(seq);  
      this._shared.triggerNotify('Video removed');
      this.updateNotify();
      setTimeout(() => {        
        if (i === this.currentPlaylistItem) {
          i = (i < this.playlistVideos.length) ? i : 0;
          if(this.playlistVideos.length > 0) {
            this.getVideo(this.playlistVideos[i]);
          } else {
            this.currentPlaylistItem = -1;
          }          
        }     
        this.findPlaylistItem();
      }, 200);      
  }

  addPlaylistItem(i: number, list: number) {
      let listType;
      let playlistItem;
      if (list === 0) {
        listType = this.feedVideos[i];
      }
      if (list === 1) {
        listType = this._shared.lastSearchedVideos[i];
      }
      if (list === 2) {
        listType = this.relatedVideos[i];
      }
      if (list === 3) {
        listType = this.currentVideoObject[i];
      }
      if (list === 4) {
        listType = this._shared.historyVideos[i];
      }

      if (typeof listType.id.videoId !== 'undefined') {
        playlistItem = this.playlistVideos.find(item => item.id.videoId === listType.id.videoId);
      } else {
        playlistItem = this.playlistVideos.find(item => item.id === listType.id);
      }

      this._shared.addKaraokeFs(listType, this.roomId);
      this._shared.triggerNotify('Added to playlist');
  }

  clearPlaylist() {
    this._shared.clearKaraokeFs();
    this.currentPlaylistItem = -1;
    // this.playlistVideos = [];
    // this._shared.playlist = [];
    // this._shared.updatePlaylist();
  }

  exportPlaylist() {
      this.showExportPlaylistModal();
  }

  exportFilePlaylist() {
      var a = document.createElement("a");
      var file = new Blob([JSON.stringify(this.playlistVideos)], {type: 'data:text/json;charset=utf8'});
      a.href = URL.createObjectURL(file);
      a.download = 'playlist.json';
      a.click();
  }

  // ---------------- Init settings ----------------

  preventOldSettings() {
    if (localStorage.length === 1 || localStorage.getItem('version') === null) {
      console.log('Updating localstorage...');
      localStorage.removeItem('version');
      localStorage.removeItem('playlist');
      localStorage.removeItem('settings');
      this._shared.settings = null;
      this._shared.playlist = null;

      this.playlistVideos = [];
    }
  }

  setSettings() {
    this._shared.getSettings().subscribe(data => {
        this.regionCode = data.api_settings[1].value;
        this.thumbnails = data.form_settings[0].value;
        this.displayVideoPlayer = data.form_settings[2].value;
        this.repeatMode = data.form_settings[3].value;
        this.darkMode = data.form_settings[4].value;
    });
  }

  toggleHeadSettings(int: number) {
    if (int === 2) {
      if (this.currentMuteState) {
        this.player.unMute();
        this.currentMuteState = false;
      } else {
        this.player.mute();
        this.currentMuteState = true;
      }
    }
  }


  // ---------------- Video fetching ----------------

  onClickRelated(event: Event, i: number) {
    this.getVideo(this.relatedVideos[i]);
  }

  onClickPlaylist(event: Event, i: number) {
    if (i === this.currentPlaylistItem) {
      this.playPauseVideo();
    } else {
        this.getVideo(this.playlistVideos[i]);
    }
  }

  getVideo(data: any) {
    //console.log("GETTING VIDEO:" + JSON.stringify(data.snippet.title));
    this.setCurrentVideoObject(data);
    if (data.id.videoId) {
      this.getStatsVideos(data.id.videoId);
    } else if (data.id) {
      this.getStatsVideos(data.id);
    }
    this.playVideo(data);
  }

  getVideoFs(data: any) {
    //console.log("GETTING VIDEO:" + JSON.stringify(data.snippet.title));
    this.setCurrentVideoObject(data, false);
    if (data.id.videoId) {
      this.getStatsVideos(data.id.videoId);
    } else if (data.id) {
      this.getStatsVideos(data.id);
    }
    this.playVideo(data, false);
  }  

  playVideo(data: any, fromMe = true) {
    if (data.id !== this.currentVideo.id || this.currentState === -1) {
      if (typeof data.id.videoId !== 'undefined') {
        this.currentVideo.id = data.id.videoId;
      } else {
        this.currentVideo.id = data.id;
      }
      this.currentVideo.title = data.snippet.title;
      this._shared.addHistoryVideo(data);      
      if(this.isDesktop) {
        this.player.loadVideoById(this.currentVideo.id);
      } else {
        this.currentState = 1;
      }   
      this.getRelatedVideos();
      this.findPlaylistItem();
    }
  }

  getStatsVideos(query: string) {
     this.youtube.statsVideos(query).subscribe(
        result => {          
          // var i = this.playlistVideos.indexOf(this.currentVideoObject[0]);          
          this.currentVideo.id = result.items[0].id;
          this.currentVideo.title = result.items[0].snippet.title;
          this.currentVideo.channelTitle = result.items[0].snippet.channelTitle;
          this.currentVideo.stats.likes = result.items[0].statistics.likeCount;
          this.currentVideo.stats.dislikes = result.items[0].statistics.dislikeCount;
          this.currentVideo.stats.views = result.items[0].statistics.viewCount;
          this.shareLink = 'https://youtu.be/' + this.currentVideo.id;  
          console.log("CURRENT:" + JSON.stringify(result.items[0].snippet.title));

          if(!result.items[0].status.embeddable) {            
            var title = result.items[0].snippet.title;
            this._shared.triggerNotify('This karaoke title cannot be played outside Youtube.com. No worries! We temporarily replace it with an embeddable one.', 5000);                                                       
            this.youtube.flagEmbeddable(result.items[0].id, 
              result.items[0].snippet.title, 
              result.items[0].snippet.channelId,
              result.items[0].snippet.channelTitle,
              this.roomId)
              .subscribe(result => {
                if(result.replaceId) {
                  if(this.isDesktop) {
                    this.player.loadVideoById(result.replaceId);
                  } else {                
                    this.playPauseVideo();
                  }
                } else {
                  this.subscription = this.youtube.searchVideo(title, true).subscribe(result => {
                    if(this.isDesktop) {
                      var i = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
                      this.player.loadVideoById(result.items[i].id);
                    } else {                
                      this.playPauseVideo();
                    }
                    this.subscription.unsubscribe();
                  });
                }
                setTimeout( () => {
                  this._shared.triggerNotify(JSON.stringify(result.replaceId), 3000);                   
                }, 6000);
              },
              error => {
                console.log('error on unembeddable videos');
              }
            );
          }
        },
        error => {
          console.log('error on related videos');
        }
    );
  }

  getRelatedVideos() {
    if(this.isDesktop) {
      this.youtube.relatedVideos(this.currentVideo.id).subscribe(
        result => {
          this.relatedVideos = result.items;
          if (this.playlistPrefill) {
            this.playlistInit();
            this.playlistPrefill = false;
          }
        },
        error => {
          console.log('error on related videos');
        }
      );
    }
  }

  // ---------------- Player controls ----------------

  playPauseVideo() {
    var pState = "";
    if (this.currentState === 1) {
      if(this.isDesktop) {
        this.player.pauseVideo();
      } else {
        this.currentState = 0;
      }     
      pState = "pause";
      console.log("Locals State: PAUSE video");  
    } else {
      if(this.isDesktop) {
        this.player.playVideo();
      } else {
        this.currentState = 1;
      }        
      pState = "play";
      console.log("Locals State: PLAY video");  
    }
    this.fsVideoStats.doc('playback-' + this.roomId).set({"state": pState});      
  }

  RangeNouseDown() {
    this.videoRangeMouseActive = true;
    this.stopRange();
  }

  RangeMouseMove(value: number) {
      if (this.videoRangeMouseActive) {
        this.videoCurRange = value;
        this.videoRangePercent = (this.videoCurRange / this.videoMaxRange) * 100;
        this.videoCurFull = this.timeFormat(this.videoCurRange);
      }
  }

  RangeMouseUp(value: number) {
    if (this.currentState !== -1 && this.currentState !== 1) {
      this.player.playVideo();
    }
    if (this.currentState === 1) {
      this.startRange();
    } else {
      this.stopRange();
    }

    this.videoCurRange = value;
    this.videoRangePercent = (this.videoCurRange / this.videoMaxRange) * 100;
    this.videoCurFull = this.timeFormat(this.videoCurRange);

    this.player.seekTo(this.videoCurRange, true);
    this.videoRangeMouseActive = false;
  }

  volumeRangeMouseMove(value: number) {
    if (this.volumeRangeMouseActive) {
      if (this.currentMuteState) {
        this.player.unMute();
        this.currentMuteState = false;
      }
    }
  }

  volumeRangeMouseUp(value: number) {
    if (this.currentMuteState) {
      this.player.unMute();
      this.currentMuteState = false;
    }
    this.player.setVolume(value);
  }

  checkVolumeRange() {
    if (this.currentState !== -1) {
      this.currentMuteState = this.player.isMuted();
      this.videoCurVolume = this.player.getVolume();
    }
  }

  // ---------------- Modal functions ----------------

  closeModal() {
    this.modal = false;
    this.modalPlaylist = false;
    this.modalExportPlaylist = false;
  }
  closeUsageModal() {
    this.modal = false;
    this.UsageModalDesktop = false;
    this.UsageModalMobile = false;
  }  

  showPlaylistModal(i: number) {
    this.modal = true;
    this.modalPlaylist = true;
    this.modalPlaylistItem = i;
  }

  showExportPlaylistModal() {
    this.modal = true;
    this.modalExportPlaylist = true;
  }

  confirmModal() {
    //this.removePlaylistItem(this.modalPlaylistItem);
    this.modal = false;
  }

  // ---------------- NwJS Init ----------------

  initNWJS() {
    const win = this.nw.Window.get();

    this.nw.Window.get().on('new-win-policy', (frame, url, policy) => {
        policy.ignore();
        this.nw.Shell.openExternal(url);
    });

    this.nw.Window.get().on('restore', () => {
        console.log('e restored');
        this.maximized = false;
    });

    this.nw.Window.get().on('maximize', () => {
        console.log('e max');
        this.maximized = true;
    });
  }

  initShortcut() {
    const globalThis = this;
    const option = [
      {
        key : 'MediaNextTrack',
        active : () => {
          globalThis.playPlaylistItem('next', globalThis.currentPlaylistItem);
        },
        failed : (msg) => {
          console.log(msg);
        }
      },
      {
        key : 'MediaPrevTrack',
        active : () => {
          globalThis.playPlaylistItem('prev', globalThis.currentPlaylistItem);
        },
        failed : (msg) => {
          console.log(msg);
        }
      },
      {
        key : 'MediaPlayPause',
        active : () => {
          globalThis.playPauseVideo();
        },
        failed : (msg) => {
          console.log(msg);
        }
      }
    ];

    Object.keys(option).map(i => {
      const shortcut = this.nw.Shortcut(option[i]);
      this.nw.Shortcut.registerGlobalHotKey(shortcut);
    });
  }

  winMaximize() {
    const win = this.nw.Window.get();

    if (!this.maximized) {
      win.maximize();
      this.maximized = true;
    } else {
      win.unmaximize();
      this.maximized = false;
    }
  }

  winClose() {
    const win = this.nw.Window.get();
    win.close();
  }

  winMinimize() {
    const win = this.nw.Window.get();
    win.minimize();
  }
  // ---------------- Related functions ----------------

  openMobileMenu() {
    if (this.menuActive) {
      this.menuActive = false;
    } else {
      this.menuActive = true;
    }
  }

  onCopyVideoItemLink(i: number, list: number) {
    let listType;
    const youtubeLink = 'https://youtu.be/';
    if (list === 0) {
      listType = this.feedVideos[i];
    }
    if (list === 1) {
      listType = this._shared.lastSearchedVideos[i];
    }
    if (list === 2) {
      listType = this.relatedVideos[i];
    }
    if (list === 3) {
      listType = this.playlistVideos[i];
    }
    if (list === 4) {
      listType = this._shared.historyVideos[i];
    }

    if (typeof listType.id.videoId !== 'undefined') {
      this.videoItemIDvalue.nativeElement.value = youtubeLink + listType.id.videoId;
    } else {
      this.videoItemIDvalue.nativeElement.value = youtubeLink + listType.id;
    }
    this.videoItemIDvalue.nativeElement.select();
    this.videoItemIDvalue.nativeElement.focus();
    document.execCommand('copy');
    this.videoItemIDvalue.nativeElement.blur();
    this.copyShareLink();
  }

  scrollToBottom() {
      try {
        setTimeout( () => {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        }, 200);
      } catch (err) {
        console.log(err);
        console.log('scroll issue');
      }
  }


  copyShareLink() {
    if (!this.notify.enabled) {
      document.execCommand('Copy');
      this._shared.triggerNotify('Copied');
      this.updateNotify();
    } else {
      setTimeout(() => {
          document.execCommand('Copy');
          this._shared.triggerNotify('Copied');
          this.updateNotify();
      }, 1000);
    }
  }

  updateNotify() {
    this.notify = this._shared.notify;
    setTimeout(() => this.notify = this._shared.notify, 1000);
  }

  timeFormat(time: number) {
    const hours: any = Math.floor(time / 3600);
    const minutes: any = Math.floor(time % 3600 / 60);
    const seconds: any = Math.floor(time % 3600 % 60);
    const value = (parseInt(hours, 10) < 10 ? '0' : '' ) + parseInt(hours, 10) + ':'
              + (parseInt(minutes, 10) < 10 ? '0' : '' ) + parseInt(minutes, 10) + ':'
              + (parseInt(seconds, 10) < 10 ? '0' : '' ) + parseInt(seconds, 10);
    return value;
  }

}
