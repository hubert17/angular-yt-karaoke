using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

// SELF HOSTING IN IIS (POWERSHELL)
//$env:LAUNCHER_ARGS = "-p ""C:\Program Files\dotnet\dotnet.exe"" -a ""exec \""C:\Users\DRIVE_D\My Documents\_GitHub\_YTKaraokeGabs\YoutubeK\iisexpress\YoutubeK.dll\"""" -pidFile $([System.IO.Path]::GetTempFileName()) -wd ""C:\Users\DRIVE_D\My Documents\_GitHub\_YTKaraokeGabs\YoutubeK\iisexpress"" -pr YoutubeK"
//$env:LAUNCHER_PATH = "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\IDE\Extensions\Microsoft\Web Tools\ProjectSystem\VSIISExeLauncher.exe" "C:\Program Files (x86)\IIS Express\iisexpress" /config:"C:\Users\DRIVE_D\My Documents\_GitHub\_YTKaraokeGabs\YoutubeK\.vs\config\applicationhost.config" /site:"YoutubeK"

namespace YoutubeK
{
    public class Program
    {
        public static void Main(string[] args)
        {
            BuildWebHost(args).Run();
        }

        public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .CaptureStartupErrors(true) // For debugging https://youtubek.scm.azurewebsites.net
                .UseStartup<Startup>()
                .Build();
    }
}
