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
                    +  query + '&key='
                    + this.apiKey
                )
                .map(response => response.json());
        }
    }


    searchVideo(query: string, embeddable = false) {
        if (this.apiKey) {
            var numSearch = this.numSearchRes;
            var paramEmbeddable = "";
            if(embeddable) {
                paramEmbeddable = "&videoEmbeddable=true";
                if(query) {
                    numSearch = "4";
                }           
            }
            var url = this.url 
            + 'search?part=snippet&q=karaoke+' + query 
            + '&maxResults=' + numSearch
            + '&type=video' + paramEmbeddable                  
            + '&key=' + this.apiKey; //'&key=AIzaSyC1WE0bNK-vyGNndluOs-mJ7JKAbMHcS8A'

            return this.http.get(url).map(response => response.json());               
        }        
    }

    flagEmbeddable(id: string, title: string, channelId: string, channelName = "", fixBy = "") {
        var url = '/fixembed?id='
                    + id + '&t=' + title + '&cId=' + channelId + '&c=' + channelName + '&u=' + fixBy;
        return this.http.get(url).map(response => response.json());   
    }

    flagAsHighQuality(id: string, title: string, channelId = "", channelName = "", flagby = "") {
        var url = '/fixembed?id='
        + id + '&t=' + title + '&cId=' + channelId + '&c=' + channelName + '&u=' + flagby + '&hq=1';
        return this.http.get(url).map(response => response.json());
    }

    relatedVideos(query: string) {
        if (this.apiKey && query) {
            return this.http.get(
                    this.url + 'search?part=snippet&relatedToVideoId='
                    + query + '&maxResults=' + this.numRelatedRes
                    + '&type=video&videoEmbeddable=true&key='
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

    feedVideos(nextPageToken = "") {
        if (this.apiKey) {
             var channelId = (new URL(location.href)).searchParams.get("channelId");
             if(nextPageToken) {
                 nextPageToken = "&pageToken=" + nextPageToken;
             }
             var url = "";             
             if(channelId) {
                 url = this.url 
                 + 'search?part=snippet&channelId=' + channelId + nextPageToken
                 + '&maxResults=' + this.numSearchRes 
                 + '&type=video&videoEmbeddable=true'                  
                 + '&key=' + this.apiKey;
             } else {
                 url = this.url 
                 + 'search?part=snippet&q=karaoke'  + nextPageToken
                 + '&maxResults=' + this.numSearchRes 
                 + '&type=video'                  
                 + '&key=' + this.apiKey;                
             }         
             return this.http.get(url).map(response => response.json()); 
        }   
    }

    
}
