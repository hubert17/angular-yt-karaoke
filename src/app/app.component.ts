import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { YoutubeGetVideo } from './shared/youtube.service';
import { SharedService } from './shared/lists.service';
import { NwjsService } from './shared/nwjs.service';

import { Observable } from 'rxjs/Observable';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-yt',
  templateUrl: 'app.component.html'
})

export class AppComponent implements OnInit {
  @ViewChild('playlistContainer') private myScrollContainer: ElementRef;
  @ViewChild('videoItemIDvalue') private videoItemIDvalue: ElementRef;

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

  constructor(
    private youtube: YoutubeGetVideo,
    private shared: SharedService,
    private nwjs: NwjsService,
    private afs: AngularFirestore
  ) {
    this._shared = shared;
    this._nwjs = nwjs;
    this.notify = this._shared.notify;
  }

  ngOnInit() {
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

      this.fsVideosCol = this.afs.collection('karaoke');
      this.fsVideos = this.fsVideosCol.valueChanges();              
      this.fsVideos.subscribe(data => {
        this.playlistVideos = data;
      });

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
      'origin': 'http://google.com',
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

  setCurrentVideoObject(data: any) {
    console.log(JSON.stringify(data));
    this.currentVideoObject = [];
    this.currentVideoObject.push(data);
    var fsKarCurrent = this.afs.collection<any>('Current');
    fsKarCurrent.doc('1').set({"Seq" : 1 });
  }

  setDefaultPlayer() {
      this.feedVideos = this._shared.feedVideos;
      this.setCurrentVideoObject(this.feedVideos[0]);
      this.currentVideo.id = this.feedVideos[0].id;
      this.currentVideo.title = this.feedVideos[0].snippet.title;
      this.currentVideo.stats.likes = this.feedVideos[0].statistics.likeCount;
      this.currentVideo.stats.dislikes = this.feedVideos[0].statistics.dislikeCount;
      this.currentVideo.stats.views = this.feedVideos[0].statistics.viewCount;
      this.shareLink = 'https://youtu.be/' + this.currentVideo.id;
      this.getRelatedVideos();
      this.findPlaylistItem();
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
    if (this.currentState) {
      this.videoRangeTimer = setInterval(() => {
        console.log('Rangeu merge de nebun...');
        this.videoCurRange = this.player.getCurrentTime();
        this.videoCurFull = this.timeFormat(this.videoCurRange);
        this.videoRangePercent = (this.videoCurRange / this.videoMaxRange) * 100;
      }, 1000);
    }
  }

  stopRange() {
     clearInterval(this.videoRangeTimer);
  }

  // ---------------- Playlist settings ----------------

  playlistInit() {
      // if (localStorage.getItem('playlist') === null || localStorage.getItem('playlist').length === 2) {
      //   this.playlistVideos = JSON.parse(JSON.stringify(this.relatedVideos));
      //   this._shared.playlist = JSON.parse(JSON.stringify(this.playlistVideos));
      //   this._shared.updatePlaylist();
      // } else {
      //   this._shared.getPlaylist();
      //   this.playlistVideos = JSON.parse(JSON.stringify(this._shared.playlist));
      // }
      this.findPlaylistItem();
  }

  findPlaylistItem() {
      let playlistItem;
      if (typeof this.currentVideoObject[0].id.videoId !== 'undefined') {
        playlistItem = this.playlistVideos.find(item => item.id.videoId === this.currentVideoObject[0].id.videoId);
      } else {
        playlistItem = this.playlistVideos.find(item => item.id === this.currentVideoObject[0].id);
      }
      this.currentPlaylistItem = this.playlistVideos.indexOf(playlistItem);
  }

  playPlaylistItem(direction: string, i: number) {
    if (direction === 'next') {
      if (i < this.playlistVideos.length) {
        i += 1;
      }
      if (i === this.playlistVideos.length) {
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
      //console.log('sequenceId: ' + seq);
      this._shared.deleteKaraokeFs(seq);    
      this._shared.triggerNotify('Video removed');
      this.updateNotify();
      setTimeout(() => {
        if (i === this.currentPlaylistItem) {
          this.currentPlaylistItem = -1;
        }
        // this.playlistVideos.splice(i, 1);
        // this._shared.playlist.splice(i, 1);
        // this._shared.updatePlaylist();
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

      this._shared.addKaraokeFs(listType);
      this._shared.triggerNotify('Added to playlist');
      // if (typeof playlistItem === 'undefined') {
      //   this.playlistVideos.push(listType);

      //   this._shared.playlist.push(listType);
      //   this._shared.updatePlaylist();
      //   this._shared.addKaraokeFs(listType);

      //   this.findPlaylistItem();
      //   this._shared.triggerNotify('Added to playlist');
      //   this.updateNotify();
      //   this.scrollToBottom();
      // } else {
      //   this._shared.triggerNotify('Video is already in playlist');
      //   this.updateNotify();
      // }
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
    this.setCurrentVideoObject(data);
    if (data.id.videoId) {
      this.getStatsVideos(data.id.videoId);
    } else if (data.id) {
      this.getStatsVideos(data.id);
    }
    this.playVideo(data);
  }

  playVideo(data: any) {
    if (data.id !== this.currentVideo.id || this.currentState === -1) {
      if (typeof data.id.videoId !== 'undefined') {
        this.currentVideo.id = data.id.videoId;
      } else {
        this.currentVideo.id = data.id;
      }
      this.currentVideo.title = data.snippet.title;
      this._shared.addHistoryVideo(data);
      this.player.loadVideoById(this.currentVideo.id);
      this.getRelatedVideos();
      this.findPlaylistItem();
    }
  }

  getStatsVideos(query: string) {
    this.youtube.statsVideos(query).subscribe(
        result => {
          this.currentVideo.id = result.items[0].id;
          this.currentVideo.title = result.items[0].snippet.title;
          this.currentVideo.channelTitle = result.items[0].snippet.channelTitle;
          this.currentVideo.stats.likes = result.items[0].statistics.likeCount;
          this.currentVideo.stats.dislikes = result.items[0].statistics.dislikeCount;
          this.currentVideo.stats.views = result.items[0].statistics.viewCount;
          this.shareLink = 'https://youtu.be/' + this.currentVideo.id;
        },
        error => {
          console.log('error on related videos');
        }
    );
  }

  getRelatedVideos() {
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

  // ---------------- Player controls ----------------

  playPauseVideo() {
    if (this.currentState === 1) {
      this.player.pauseVideo();
    } else {
      this.player.playVideo();
    }
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
