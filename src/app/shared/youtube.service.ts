import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class YoutubeGetVideo {


    private apiKey: string;
    private url = 'https://www.googleapis.com/youtube/v3/';
    public regionCode: string;
    private numSearchRes: string;
    private numRelatedRes: string;
    private videoDetails = 'part=snippet,contentDetails,statistics,status';
    private channelDetails = 'part=brandingSettings,snippet,contentDetails,statistics';
    private feedDetails = '&chart=mostPopular';
    private settings: Array<any>;

    constructor(
        private http: Http,
    ) {}

    defaultApiSet(data: any) {
        this.settings = data.api_settings;
        this.apiKey = this.settings[0].value;
        this.regionCode = this.settings[1].value;
        this.numSearchRes = this.settings[2].value;
        this.numRelatedRes = this.settings[3].value;
    }

    getChannel(query: string) {
        if (this.apiKey) {
            return this.http.get(
                    this.url + 'channels?'
                    + this.channelDetails + '&id='
                    + query + '&key='
                    + this.apiKey
                )
                .map(response => response.json());
        }
    }

    searchVideo(query: string) {
        if (this.apiKey) {
            var url = this.url 
            + 'search?part=snippet&q=karaoke+' + query 
            + '&maxResults=' + this.numSearchRes 
            + '&type=video' //&videoEmbeddable=true                    
            + '&key=' + this.apiKey; //'&key=AIzaSyC1WE0bNK-vyGNndluOs-mJ7JKAbMHcS8A'
            return this.http.get(url).map(response => response.json());               
        }        
    }

    flagEmbeddable(id: string, title: string, channel: string) {
        var url = 'http://youtubek.azurewebsites.net/youtube/embed?id='
                    + id + '&t=' + title + '&c=' + channel;
        return this.http.get(url).map(response => response.json());   
    }

    relatedVideos(query: string) {
        if (this.apiKey) {
            return this.http.get(
                    this.url + 'search?part=snippet&relatedToVideoId='
                    + query + '&maxResults='
                    + this.numRelatedRes + '&type=video&videoEmbeddable=true&key='
                    + this.apiKey
                )
                .map(response => response.json());
        }
    }

    statsVideos(query: string) {
        if (this.apiKey) {
            return this.http.get(
                    this.url + 'videos?'
                    + this.videoDetails + '&id='
                    + query + '&key='
                    + this.apiKey
                )
                .map(response => response.json());
        }
    }

    feedVideos() {
        if (this.apiKey) {
            return this.http.get(
                    this.url + 'videos?'
                    + this.videoDetails + this.feedDetails + '&regionCode='
                    + this.regionCode + '&maxResults=25&key='
                    + this.apiKey
                )
                .map(response => response.json());
        }
    }
}
