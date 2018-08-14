using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Services;
using Google.Apis.Upload;
using Google.Apis.YouTube.v3;
using Google.Apis.YouTube.v3.Data;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using YoutubeK.Models;

namespace YoutubeK.Services
{
    public interface IUtube
    {
        [AutomaticRetry(Attempts = 0)]
        Task DownloadVideo(string VideoId, string Title, string ChannelId, string ChannelName, string FixBy);
        Task UploadVideo(string VideoId, string Title = "", string Channel = "", string ChannelId = "", string FixBy = "");
        void DeleteVideo(string VideoId);
        void ClearVideoFolder();
    }

    public class Utube : IUtube
    {
        private YoutubekDbContext _db;
        private IHostingEnvironment _env;
        private ISimpleLogger _log;

        public Utube(YoutubekDbContext db, IHostingEnvironment env, ISimpleLogger log)
        {
            _db = db;
            _env = env;
            _log = log;
        }

        [AutomaticRetry(Attempts = 0)]
        public async Task DownloadVideo(string VideoId, string Title, string ChannelId, string ChannelName, string FixBy)
        {
            _log.LogInformation("Downloading video...");
            using (var service = VideoLibrary.Client.For(VideoLibrary.YouTube.Default))
            {
                string folder = Path.Combine(_env.WebRootPath, @"Videos");
                string videoFilename = VideoId + ".mp4";
                string videoFilepath = Path.Combine(folder, videoFilename);
                try
                {
                    if (!File.Exists(videoFilepath))
                    {
                        var video = service.GetVideo("https://youtube.com/watch?v=" + VideoId + "&vq=large");
                        await System.IO.File.WriteAllBytesAsync(videoFilepath, video.GetBytes());
                        _log.LogInformation("Done saving video.");
                    }
                    else
                        _log.LogInformation("Video already exist.");
                }
                catch
                {
                    _log.LogError("Error in retrieving video and file write.");
                }

            }

        }

        private async Task<UserCredential> GetGoogleCredentials()
        {
            UserCredential credential;
            var stream = new FileStream(Path.Combine(_env.ContentRootPath, @"ApiSecrets", @"client_secret_yubertogabon.json"), FileMode.Open, FileAccess.Read);

            CancellationTokenSource cts = new CancellationTokenSource();
            cts.CancelAfter(TimeSpan.FromSeconds(20));
            CancellationToken ct = cts.Token;

            _log.LogInformation("Retrieving Google credential...");

            // Token based
            var token = new TokenResponse { RefreshToken = "1/QWUdcX173oR5hVDQv5K2yU0vcmlKbGFWHKdLQrB8SzE" };
            credential = new UserCredential(new GoogleAuthorizationCodeFlow(
                new GoogleAuthorizationCodeFlow.Initializer
                {
                    ClientSecrets = GoogleClientSecrets.Load(stream).Secrets
                }), "yuberto.gabon", token);

            // Web app login
            //credential = await GoogleWebAuthorizationBroker.AuthorizeAsync(
            //    GoogleClientSecrets.Load(stream).Secrets,
            //    new[] { YouTubeService.Scope.YoutubeUpload },
            //    "yuberto.gabon",
            //    ct
            //);

            if (ct.IsCancellationRequested)
            {
                _log.LogError("Cancellation requested or unauthorized.");
                return null;
            }

            _log.LogInformation("Valid Google credentials. Successfully authorized.");
            return credential;

        }

        public async Task UploadVideo(string VideoId, string Title, string ChannelId, string ChannelName, string FixBy)
        {
            var ReplaceId = string.Empty;
            var karaoke = _db.Karaokes;
            if (karaoke != null)
                ReplaceId = karaoke.Where(x => x.Id == VideoId).Select(k => k.ReplaceId).FirstOrDefault();

            string folder = Path.Combine(_env.WebRootPath, @"Videos");
            string videoFilename = VideoId + ".mp4";
            string videoFilepath = Path.Combine(folder, videoFilename);

            if (string.IsNullOrWhiteSpace(ReplaceId) && File.Exists(videoFilepath))
            {
                var credential = GetGoogleCredentials().Result;
                if (credential == null) return;

                var youtubeService = new YouTubeService(new BaseClientService.Initializer()
                {
                    HttpClientInitializer = credential,
                    ApplicationName = Assembly.GetExecutingAssembly().GetName().Name,
                });

                var video = new Video();
                video.Snippet = new VideoSnippet();
                video.Snippet.Title = string.IsNullOrEmpty(Title) ? videoFilename : Title + " [YoutubeK]";
                video.Snippet.Description = $" VideoId: {VideoId} {Environment.NewLine} From Channel: {ChannelName} {Environment.NewLine} ChannelId: {ChannelId} {Environment.NewLine} Fixby: {FixBy} {Environment.NewLine} www.bernardgabon.com/YoutubeK";
                video.Snippet.Tags = new string[] { VideoId, "UC8uAsBcsDqRwNgueBqD0X5A", "#hubert17karaoke" };
                video.Snippet.CategoryId = "10"; // See https://developers.google.com/youtube/v3/docs/videoCategories/list
                video.Status = new VideoStatus();
                video.Status.PrivacyStatus = "unlisted"; // or "private" or "public"

                _log.LogInformation($"Uploading {videoFilepath}...");
                youtubeService.HttpClient.Timeout = TimeSpan.FromMinutes(15.00);
                const int KB = 0x400;
                var minimumChunkSize = 256 * KB;

                try
                {
                    using (var fileStream = new FileStream(videoFilepath, FileMode.Open))
                    {
                        var videosInsertRequest = youtubeService.Videos.Insert(video,
                            "snippet,status", fileStream, "video/*");
                        videosInsertRequest.ProgressChanged +=
                            videosInsertRequest_ProgressChanged;
                        videosInsertRequest.ResponseReceived +=
                            videosInsertRequest_ResponseReceived;
                        // The default chunk size is 10MB, here will use 1MB.
                        videosInsertRequest.ChunkSize = minimumChunkSize * 4;
                        await videosInsertRequest.UploadAsync();
                    }
                }
                catch
                {
                    _log.LogError("Video upload error.");
                }

            }
            else
            {
                _log.LogWarning("VideoId has already been replaced. Uploading cancelled.");
            }
        }

        private void videosInsertRequest_ProgressChanged(Google.Apis.Upload.IUploadProgress progress)
        {
            switch (progress.Status)
            {
                case UploadStatus.Uploading:
                    _log.LogInformation($"Still uploading... {progress.BytesSent} bytes sent.");
                    break;

                case UploadStatus.Failed:
                    _log.LogError($"An error prevented the upload from completing."); // Ex: {progress.Exception}
                    break;
            }
        }

        private void videosInsertRequest_ResponseReceived(Video video)
        {
            _log.LogInformation($"Video id '{video.Id}' was successfully uploaded.");
            string VideoId = video.Snippet.Tags[0];
            HttpNotify(VideoId, video.Snippet.Title, video.Id);
        }
          
        private void HttpNotify(string videoId, string title, string replaceId)
        {
            var query = string.Format("fixembed?id={0}&t={1}&rId={2}", videoId, title, replaceId);
            using (var client = new HttpClient(new HttpClientHandler { AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate }))
            {
                client.BaseAddress = new Uri("http://youtubek.azurewebsites.net/youtube/");
                HttpResponseMessage response = client.GetAsync(query).Result;
                response.EnsureSuccessStatusCode();
                string result = response.Content.ReadAsStringAsync().Result;
                _log.LogInformation($"[HttpNotify]: {result}");
            }
        }

        public void DeleteVideo(string VideoId)
        {            
            string folder = Path.Combine(_env.WebRootPath, @"Videos");
            string videoFilename = VideoId + ".mp4";
            string videoFilepath = Path.Combine(folder, videoFilename);
            if (File.Exists(videoFilepath))
                File.Delete(videoFilepath);
        }

        public void ClearVideoFolder()
        {
            try
            {
                string folder = Path.Combine(_env.WebRootPath, @"Videos");
                System.IO.DirectoryInfo di = new DirectoryInfo(folder);
                foreach (FileInfo file in di.GetFiles())
                {
                    file.Delete();
                }

                _log.LogInformation("Successfully cleared video folder.");
            }
            catch (Exception ex)
            {
                _log.LogError("Failed clearing Video folder. Err: " + ex.Message);
            }

        }
    }
}
