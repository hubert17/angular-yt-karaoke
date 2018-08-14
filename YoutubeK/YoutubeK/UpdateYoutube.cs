using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Text.RegularExpressions;

using System.Threading;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Upload;
using Google.Apis.Util.Store;
using Google.Apis.YouTube.v3;
using Google.Apis.YouTube.v3.Data;
using Google.Apis.Services;

namespace YoutubeK
{
    public class UpdateYoutube
    {
        private async Task update_videos()
        {
            String client_secret_path = ""; // here you put the path to your .json client secret file, generated in your Google Developer Account
            String username = ""; // youtube account login username


            UserCredential credential;
            using (var stream = new FileStream(client_secret_path, FileMode.Open, FileAccess.Read))
            {
                credential = await GoogleWebAuthorizationBroker.AuthorizeAsync(
                    GoogleClientSecrets.Load(stream).Secrets,
                    new[] { YouTubeService.Scope.Youtube, YouTubeService.Scope.YoutubeUpload },
                    username,
                    CancellationToken.None,
                    new FileDataStore(this.GetType().ToString())
                );
            }

            var youtubeService = new YouTubeService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = this.GetType().ToString()
            });

            // first, we get the video we want to update
            var my_video_request = youtubeService.Videos.List("snippet, status");
            my_video_request.Id = ""; // the Youtube video id of the video you want to update
            my_video_request.MaxResults = 1;
            var my_video_response = await my_video_request.ExecuteAsync();
            var video = my_video_response.Items[0];

            // then we change it's attributes
            string title = "New title";
            string description = "New description";
            List<String> keywords = new List<String>();

            video.Snippet.Title = title;
            video.Snippet.Description = description;
            video.Snippet.Tags = new System.Collections.Generic.List<String>();

            // and tell the changes we want to youtube
            var my_update_request = youtubeService.Videos.Update(video, "snippet, status");
            my_update_request.Execute();
        }
    }
}


