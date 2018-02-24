import { Injectable } from '@angular/core';
import { YoutubeGetVideo } from './youtube.service';
import { Http } from '@angular/http';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Subscription } from 'rxjs/Subscription';

import { Router, ActivatedRoute, Params } from '@angular/router';

@Injectable()
export class SharedService {

    public feedVideos: Array<any>;
    public lastSearchedVideos: Array<any>;
    public historyVideos: Array<any> = [];
    public settings: Array<any>;
    public channel: Array<any>;
    public playlist: Array<any>;

    public fsVideosCol: AngularFirestoreCollection<any>;
    public fsVideos: Observable<any[]>;
    public fsVideoDoc: AngularFirestoreDocument<any>;
    public fsVideo: Observable<any>;

    public subscription: Subscription;

    roomId= 'public'
    //public channelId = 'default';

    _update: any;

    notify = {
        enabled: false,
        message: 'No message'
    };


    constructor(
        private youtube: YoutubeGetVideo,
        private http: Http,
        private afs: AngularFirestore,
        private route: ActivatedRoute
    ) {}

    ngOnInit(){       
        var roomId = (new URL(location.href)).searchParams.get("roomId");
        if(roomId) {
          this.roomId = roomId;
        }
    };

    getFeed(): Observable<any> {
        return new Observable(observer => {
            if (this.feedVideos) {
                observer.next(this.feedVideos);
                return observer.complete();
            }
            this.getSettings().subscribe(data => {
                this.setApiSettings();
                this.settings = data;
                this.youtube.feedVideos().subscribe(
                    result => {
                        this.feedVideos = result.items;
                        this.youtube.getChannel(result.items[0].snippet.channelId).subscribe(
                        resultChannel => {
                            this.channel = resultChannel;
                            observer.next(this.feedVideos);
                            observer.complete();
                        });
                    },
                    error => {
                        console.log('error on feed videos' + error);
                    }
                );
            });
        });
    }

    getChannel(query: any): Observable<any> {
        return new Observable(observer => {
            if (this.channel) {
                observer.next(this.channel);
                return observer.complete();
            } else {
                this.youtube.getChannel(query).subscribe(
                    result => {
                        this.channel = result;
                        observer.next(this.channel);
                        observer.complete();
                    },
                    error => {
                        console.log('error on get channel ' + error);
                    }
                );
            }
        });
    }

    getSettings(): Observable<any> {
        return new Observable(observer => {
            if (this.settings) {
                observer.next(this.settings);
                return observer.complete();
            } else {
                if (localStorage.length <= 0) {
                    this.http.get('assets/settings.json')
                        .map(res => res.json())
                        .subscribe(
                        data => {
                            this.settings = data;
                            localStorage.setItem('settings', JSON.stringify(data));
                            observer.next(this.settings);
                            observer.complete();
                        },
                        error => {
                            console.log('error on get settings ' + error);
                        }
                    );
                } else {
                    this.settings = JSON.parse(localStorage.getItem('settings'));
                    observer.next(this.settings);
                    observer.complete();
                }
            }
        });
    }

    updateSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.setLocalVersion();
    }

    getPlaylist() {
        //this.playlist = JSON.parse(localStorage.getItem('playlist'));
    }

    updatePlaylist() {
        // localStorage.setItem('playlist', JSON.stringify(this.playlist));
        // this.setLocalVersion();
    }

    setApiSettings() {
        this.youtube.defaultApiSet(this.settings);
    }

    setLocalVersion() {
        if (localStorage.getItem('version') === null) {
            localStorage.setItem('version', '1');
        }
    }

    triggerNotify(message: string, timeout = 1000) {
        this.notify.enabled = true;
        this.notify.message = message;
        setTimeout(() => this.notify.enabled = false, timeout);
    }

    addHistoryVideo(data: any) {
        let key;
        for (key in this.historyVideos) {
            if (this.historyVideos[key].id === data.id) {
                this.historyVideos.splice(key, 1);
                if (this.historyVideos[this.historyVideos.length - 1] === data) {
                    this.historyVideos.splice(-1, 1);
                }
            }
        }
        this.historyVideos.unshift(data);
    }

    //this.fsVideosCol.doc('Current').set({"Seq" : data.seq });
    addKaraokeFs(data: any, roomId: string) {        
        var fsKarCount = this.afs.collection<any>('karaokeCount');
        var fsKarCol = this.afs.collection<any>('karaoke');

        // this.getRoom().subscribe(data => {
        //     roomId = data;
        // })
        if(!roomId) {
            roomId = this.roomId
        }
     
        fsKarCount.doc('1').ref.get().then(function(doc) {
            var newCount;
            if (doc.exists) {
                newCount = doc.data().count + 1;
                fsKarCount.doc('1').set({'count': newCount});        
            } else {
                fsKarCount.doc('1').set({"count" : 1 });
                newCount = 1;
            }       
            //console.log("New kId: " + newCount);           
            data.seq = newCount;
            data.roomId = roomId;
            fsKarCol.doc(String(newCount)).set(data);   
        }).catch(function(error) {
            console.log("Error getting karaokeCount:", error);
        });   
    }

    deleteKaraokeFs(karaokeId) {
        this.afs.doc('karaoke/' + karaokeId).delete();
    }

    getKaraokeFs(karaokeId) {
        this.fsVideoDoc = this.afs.doc('karaoke/' + karaokeId);
        this.fsVideo = this.fsVideoDoc.valueChanges();
    }

    clearKaraokeFs() {        
        console.log('===clearKaraokeFs===');
        this.fsVideosCol = this.afs.collection('karaoke');
        this.fsVideos = this.fsVideosCol.valueChanges();
        
        this.subscription =  this.fsVideos.subscribe(data => {
            data.forEach(karaoke => {
                console.log(karaoke.seq);
                this.afs.doc('karaoke/' + karaoke.seq).delete();
            });       
            this.subscription.unsubscribe();     
        });                
    }

    // getRoom() {
    //     return this.route.queryParams.map((params: Params) => {    
    //         return params.roomId;
    //     });
    // }

}
