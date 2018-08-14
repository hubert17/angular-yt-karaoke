using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using YoutubeK.Services;

namespace YoutubeK.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
             //return RedirectToAction("Index","Youtube");
        }

    }
}