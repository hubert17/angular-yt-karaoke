import { Injectable } from '@angular/core';
import { YoutubeGetVideo } from './youtube.service';
import { Http } from '@angular/http';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

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
    public fsNewId : string;


    _update: any;

    notify = {
        enabled: false,
        message: 'No message'
    };

    constructor(
        private youtube: YoutubeGetVideo,
        private http: Http,
        private afs: AngularFirestore
    ) {}

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
        this.playlist = JSON.parse(localStorage.getItem('playlist'));
    }

    updatePlaylist() {
        localStorage.setItem('playlist', JSON.stringify(this.playlist));
        this.setLocalVersion();
    }

    setApiSettings() {
        this.youtube.defaultApiSet(this.settings);
    }

    setLocalVersion() {
        if (localStorage.getItem('version') === null) {
            localStorage.setItem('version', '1');
        }
    }

    triggerNotify(message: string) {
        this.notify.enabled = true;
        this.notify.message = message;
        setTimeout(() => this.notify.enabled = false, 1000);
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

    addToFirebase(data: any) {
        var fsKarCount = this.afs.collection<any>('karaokeCount');
        var fsKarCol = this.afs.collection<any>('karaoke');
     
        fsKarCount.doc('1').ref.get().then(function(doc) {
            var newCount;
            if (doc.exists) {
                newCount = doc.data().count + 1;
                fsKarCount.doc('1').set({'count': newCount});        
            } else {
                fsKarCount.doc('1').set({"count" : 1 });
                newCount = 1;
            }       
            console.log("New kId: " + newCount);
            data.seq = newCount;
            fsKarCol.doc(String(newCount)).set(data);   
        }).catch(function(error) {
            console.log("Error getting karaokeCount:", error);
        });   
    }


}
