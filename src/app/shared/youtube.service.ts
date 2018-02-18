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
            console.log("Channel: " + query);
            return this.http.get(
                    this.url + 'channels?'
                    + this.channelDetails + '&id='
                    + query + '&key='
                    + this.apiKey
                )
                .map(response => response.json());
        }
    }

    searchVideo(query: string, embeddable = false) {
        var paramEmbeddable = "";
        if(embeddable) {
            paramEmbeddable = "&videoEmbeddable=true";
            if(query) {
                this.numSearchRes = "1";
            } else {
                this.numSearchRes = "20";
            }            
        }
        if (this.apiKey) {
            var url = this.url 
            + 'search?part=snippet&q=karaoke+' + query 
            + '&maxResults=' + this.numSearchRes 
            + '&type=video' + paramEmbeddable                  
            + '&key=' + this.apiKey; //'&key=AIzaSyC1WE0bNK-vyGNndluOs-mJ7JKAbMHcS8A'
            return this.http.get(url).map(response => response.json());               
        }        
    }

    flagEmbeddable(id: string, title: string, channel: string, status = "") {
        var url = 'http://youtubek.azurewebsites.net/fixembed?id='
                    + id + '&t=' + title + '&c=' + channel + '&s=' + status;
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
        //key={your_key_here}&channelId={channel_id_here}&part=snippet,id&order=date&maxResults=20
        var channelId = (new URL(location.href)).searchParams.get("channelId");
        if (this.apiKey) {
            var url = this.url 
            + 'search?part=snippet&channelId=' + channelId
            + '&maxResults=25' 
            + '&type=video&videoEmbeddable=true'                  
            + '&key=' + this.apiKey; //'&key=AIzaSyC1WE0bNK-vyGNndluOs-mJ7JKAbMHcS8A'
            return this.http.get(url).map(response => response.json());               
        }   
    }
}
