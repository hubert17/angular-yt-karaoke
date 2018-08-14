using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using YoutubeK.Services;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using VideoLibrary;
using YoutubeK.Models;
using System.Text;

namespace YoutubeK.Controllers
{
    //[Route("/Utube/[action]")]
    //[Route("/[controller]/[action]")]
    public class YoutubeController : Controller
    {
        private YoutubekDbContext _db; 
        private IHostingEnvironment _env;
        private ISimpleLogger _log;

        public YoutubeController(YoutubekDbContext db, IHostingEnvironment env, ISimpleLogger log)
        {
            _db = db;
            _env = env;
            _log = log;
        }

        public IActionResult Index(string Id = "public", string channelId = "") //TheKARAOKEChannel UCaPwSXblS8F0owlKHGc6huw  "UCYi9TC1HC_U2kaRAK6I4FSQ"
        {
            var rnd = new Random();
            var proba = rnd.NextDouble() < 80 / 100.0;

            if (proba && string.IsNullOrEmpty(channelId))
            {
                var channels = _db.Channels.ToList();
                if (channels != null)
                    channelId = "&channelId=" + channels.OrderBy(a => Guid.NewGuid()).FirstOrDefault().Id;
                if (channelId.Length < 20)
                    channelId = string.Empty;
            }
            
            Id = Id.ToLower();
            var masterQry = string.Empty;
            var minDiffQry = string.Empty;
            try
            {
                var userIp = Request.HttpContext.Connection.RemoteIpAddress.ToString();
                var masterKey = GenerateUniqueChars();
                var room = _db.Rooms.FirstOrDefault(x => x.Id == Id);
                if (room != null)
                {
                    var minDiff = (DateTime.Now - room.DateLastActive.Value).TotalMinutes;
                    minDiffQry = "&mdif=" + (int) minDiff;
                    var HostInactive = minDiff > 30;
                    if (HostInactive)
                    {
                        room.GuestCount = 1;
                        room.DateLastActive = DateTime.Now;
                        room.MasterIp = userIp;
                        room.MasterKey = masterKey;
                    }

                    if (room.GuestCount < 4 || HostInactive) // room.MasterIp == userIp || 
                        masterQry = "&auth=" + room.MasterKey;

                    room.GuestCount++;
                    _db.Entry(room).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
                }
                else
                {
                    var newRoom = new Room
                    {
                        Id = Id,
                        GuestCount = 1,
                        DateCreated = DateTime.Now,
                        DateLastActive = DateTime.Now,
                        MasterIp = userIp,
                        MasterKey = masterKey
                    };
                    _db.Rooms.Add(newRoom);
                    masterQry = "&auth=" + masterKey;
                }
                _db.SaveChanges();

            }
            catch (Exception ex)
            {
                _log.LogError(ex.Message);
            }

            return Redirect("/app?roomId=" + Id + channelId + masterQry + "&hqfb=1" + minDiffQry);
        }

        private static string GenerateUniqueChars()
        {
            char[] padding = { '=' };
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray()).TrimEnd(padding).Replace('+', '-').Replace('/', '_'); ;
        }

        public IActionResult AddChannel(string ChannelId, string Channel = "")
        {
            var result = string.Empty;
            var exists = false;
            var channels = _db.Channels;
            if(channels != null)
                exists = channels.Where(x => x.Id == ChannelId).Count() > 0;

            if (!string.IsNullOrEmpty(ChannelId) && !exists)
            {
                _db.Channels.Add(new Channel { Id = ChannelId, Name = Channel });
                _db.SaveChanges();
                result = "Added channelId: " + ChannelId;
            }
            else
            {
                string strChannel = "===TOP KARAOKE YOUTUBE CHANNELS===" + Environment.NewLine;
                if(channels != null)
                {
                    foreach (var c in channels)
                    {
                        strChannel += Environment.NewLine + c.Id + "   " + c.Name;
                    }
                }
                result = strChannel;
            }

            return Content(result);
        }

        public IActionResult Fixembed(string Id, string t = "", string c = "", string cId = "", string u = "", string s = "UnembedabbleVideo", string rId = "", int hq = 0)
        {
            var karaoke = _db.Karaokes;
            if (hq == 1)
            {
                var k = karaoke.Find(Id);
                if (k != null)
                {
                    k.IsHQ += 1;
                    k.FlagBy = u;
                    _db.Entry(k).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
                    _db.SaveChanges();
                }
                else
                {
                    var newk = new Karaoke();
                    newk.Id = Id;
                    newk.Title = t;
                    newk.ChannelId = cId;
                    newk.Channel = c;
                    newk.IsHQ = 1;
                    newk.FlagBy = u;
                    karaoke.Add(newk);
                    _db.SaveChanges();
                }
                return Json(new { hq = "❤" });
            }
            else if(hq == -1 &&  !string.IsNullOrEmpty(Id))
            {
                var k = karaoke.Find(Id);
                if (k != null)
                {
                    k.IsHQ -= 1;
                    k.FlagBy = u;
                    _db.Entry(k).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
                    _db.SaveChanges();
                }
                else
                {
                    var newk = new Karaoke();
                    newk.Id = Id;
                    newk.Title = t;
                    newk.ChannelId = cId;
                    newk.Channel = c;
                    newk.IsHQ = -1;
                    newk.FlagBy = u;
                    karaoke.Add(newk);
                    _db.SaveChanges();
                }
                return Json(new { hq = "👎" });
            }

            var ReplaceId = string.Empty;
            if (karaoke != null)
                ReplaceId = karaoke.Where(x => x.Id == Id).Select(k=>k.ReplaceId).FirstOrDefault();


            if (!string.IsNullOrEmpty(ReplaceId) && string.IsNullOrEmpty(rId))
            {
                return Json(new { replaceId = ReplaceId });
            }
            else if (!string.IsNullOrEmpty(Id) && !string.IsNullOrEmpty(rId))
            {
                //ReplaceId
                if(string.IsNullOrEmpty(ReplaceId))
                {
                    var k = karaoke.Find(Id);
                    if(k != null)
                    {
                        k.Title = string.IsNullOrEmpty(t) ? k.Title : t;
                        k.ReplaceId = rId;
                        _db.Entry(k).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
                        _db.SaveChanges();
                    }
                }
                else
                {
                    var k = new Karaoke();
                    k.Id = Id;
                    k.Title = t;
                    k.IsHQ = 0;
                    k.ReplaceId = rId;
                    karaoke.Add(k);
                    _db.SaveChanges();
                }
                return Content($"Added replaceId [{rId}] to Id [{Id}] {t}");
            }
            else if (!string.IsNullOrEmpty(Id))
            {
                if(karaoke != null && karaoke.Where(x => x.Id == Id).Count() == 0)
                {
                    _db.Karaokes.Add(new Karaoke { Id = Id, Title = t, ChannelId = cId, Channel = c, FixBy = u, Status = s });
                    _db.SaveChanges();
                }            
                var jobId = BackgroundJob.Enqueue<IUtube>(x => x.DownloadVideo(Id, t, cId, c, u));
                BackgroundJob.ContinueWith<IUtube>(jobId, x => x.UploadVideo(Id, t, cId, c, u));
                BackgroundJob.Schedule<IUtube>(x => x.DeleteVideo(Id), TimeSpan.FromHours(1));
                return Json(new { replaceId = string.Empty, replaceMsg = "Removing playback protection for " + t.ToUpper() });
            }
            else
            {
                string result = "=== YOUTUBE UNEBEDDABLE & HQ VIDEOS ===";
                result += "[VIDEO ID] ==> [REPLACE ID]  [TITLE] [FIXBY] [HQ] [FLAGBY]";
                if (karaoke != null)
                {
                    foreach (var k in karaoke)
                    {
                        result += $"{Environment.NewLine} {k.Id} ==> {k.ReplaceId}   {k.Title} [{k.FixBy}]  {(k.IsHQ > 0 ? "HQ:" + k.IsHQ : "LQ:"+k.IsHQ)} [{k.FlagBy}] ";
                    }
                }
                return Content(result);
            }


        }

        public IActionResult Delete(string Id)
        {
            var karaoke = _db.Karaokes;
            string result = "=== YOUTUBE UNEMBEDDABLE VIDEOS ===";
            result += "[VIDEO ID] ==> [REPLACE ID]  [TITLE]";

            if (!string.IsNullOrEmpty(Id))
            {
                var k = _db.Karaokes.Find(Id);
                _db.Karaokes.Remove(k);
                _db.SaveChanges();
            }

            if (karaoke != null)
            {
                foreach (var k in karaoke)
                {
                    result += Environment.NewLine + k.Id + " ==> " + k.ReplaceId + "   " + k.Title + "   " + k.FixBy;
                }
            }
            return Content(result);
        }

        public IActionResult Ishq(string[] Ids)
        {
            //var fromIds = new[] { Ids };
            var hqIds = _db.Karaokes.Where(x => x.IsHQ > 0).Select(s => s.Id).ToArray();
            var result = hqIds.Intersect(Ids).ToArray();
            return Json(result);
        }

        public IActionResult RoomActivity(string Id)
        {
            var room = _db.Rooms.Find(Id);
            if(room != null)
            {
                room.DateLastActive = DateTime.Now;
                _db.Entry(room).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
                _db.SaveChanges();
                return Json(room.DateLastActive.Value.ToString("HH:mm"));
            }
            return Json("Failed updating room activity.");
        }

        public IActionResult IsMaster(string Id, string token)
        {
            var room = _db.Rooms.Find(Id);
            if(room != null)
            {
                //_log.LogInformation($"masterDbKey: {room.MasterKey} / masterKey: {token}");
                if(room.MasterKey == token)
                    return Json(new { isMaster = 1 });
            }

            return Json(new { isMaster = 0 });
        }

        public IActionResult ClearVideoFolder()
        {
            try
            {
                string folder = Path.Combine(_env.WebRootPath, @"Videos");
                System.IO.DirectoryInfo di = new DirectoryInfo(folder);
                foreach (FileInfo file in di.GetFiles())
                {
                    file.Delete();
                }
                return Content("Cleared.");
            }
            catch(Exception ex)
            {
                return Content(ex.Message);
            }
        }
    }

}


