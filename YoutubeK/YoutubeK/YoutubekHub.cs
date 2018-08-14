using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace YoutubeK
{
    public class YoutubekHub : Hub
    {
        Karaokeys _karaokeys;
        IApplicationLifetime _appLifetime;

        public YoutubekHub(Karaokeys karaokeys, IApplicationLifetime appLifetime)
        {
            _karaokeys = karaokeys;
            _appLifetime = appLifetime;
        }

        public void SendToAll(string karaoKey, string videoItem, int actionType, string role, string connectionId)
        {
            if (actionType == 1) // ADD PLAYLIST ITEM
            {
                Clients.AllExcept(new List<string> { Context.ConnectionId }).InvokeAsync("sendToAll", karaoKey, videoItem, actionType, role, connectionId);
                //Clients.All.InvokeAsync("sendToAll", karaoKey, videoItem, actionType, role, connectionId);
            }
            else if (actionType == 2) // JOIN
            {
                //var ValidKey = CacheKeys(new List<string>()).Contains(karaoKey);
                var ValidKey = _karaokeys.Keys.Where(x => x.Key == karaoKey).FirstOrDefault();
                if (ValidKey != null)
                {
                    var _role = ValidKey.IsMaster ? "master" : "goer";
                    Clients.All.InvokeAsync("sendToAll", karaoKey, "", actionType, _role, Context.ConnectionId);
                }
                else
                    Clients.All.InvokeAsync("sendToAll", karaoKey, "", actionType, "invalidkey", Context.ConnectionId);
            }
            else if (actionType == 3) // CREATE
            {
                _karaokeys.Keys.Add(new Karaokeys.KeyRole { Key = karaoKey, IsMaster = true });
                _karaokeys.Keys.Add(new Karaokeys.KeyRole { Key = videoItem, IsMaster = false });

                Clients.Client(Context.ConnectionId).InvokeAsync("sendToAll", karaoKey, "", actionType, "master", Context.ConnectionId);
            }
            else if (actionType == -1) // CLEAR PLAYLIST
            {
                //Clients.AllExcept(new List<string> { Context.ConnectionId }).InvokeAsync("sendToAll", karaoKey, videoItem, actionType, role, connectionId);
                Clients.All.InvokeAsync("sendToAll", karaoKey, videoItem, actionType, role, connectionId);
            }
            else if (actionType == -2)
            {
                var Keys = "MASTER KEYS\n" + string.Join(", ", _karaokeys.Keys.Where(x => x.IsMaster).Select(s => s.Key));
                Keys += "GOER KEYS\n" + string.Join(", ", _karaokeys.Keys.Where(x => !x.IsMaster).Select(s => s.Key));
                Clients.Client(Context.ConnectionId).InvokeAsync("sendToAll", karaoKey, Keys, actionType, "admin", Context.ConnectionId);
            }            
            else if (actionType == -100)
            {
                Clients.All.InvokeAsync("sendToAll", karaoKey, "Restarting the server. Please refresh in 5 seconds.", actionType, role, connectionId);
                try
                {
                    Task.Delay(3000).ContinueWith(t =>
                        new WebAppServices(_appLifetime).ShutdownSite()
                    );
                }
                catch
                {
                    Clients.All.InvokeAsync("sendToAll", karaoKey, "Failed to restart the webapp. :(", actionType, role, connectionId);
                }
                
            }
            else
                 Clients.AllExcept(new List<string> { Context.ConnectionId }).InvokeAsync("sendToAll", karaoKey, videoItem, actionType, role, connectionId);
        }
    }
}

public class Karaokeys
{
    public Karaokeys()
    {
        Keys = new List<KeyRole>();
    }
    public List<KeyRole> Keys { get; set; }

    public class KeyRole
    {
        public string Key { get; set; }
        public bool IsMaster { get; set; }
    }

}


public class WebAppServices
{
    private IApplicationLifetime ApplicationLifetime { get; set; }

    public WebAppServices(IApplicationLifetime appLifetime)
    {
        ApplicationLifetime = appLifetime;
    }

    public void ShutdownSite()
    {
        // Later bro
        ApplicationLifetime.StopApplication();
    }

}