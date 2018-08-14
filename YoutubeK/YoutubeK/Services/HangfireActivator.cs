using Hangfire.Dashboard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace YoutubeK.Services
{
    public class HangfireActivator : Hangfire.JobActivator
    {
        private readonly IServiceProvider _serviceProvider;

        public HangfireActivator(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public override object ActivateJob(Type type)
        {
            return _serviceProvider.GetService(type);
        }
    }
}

public class HangireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{

    public bool Authorize(DashboardContext context)
    {
        //if (HttpContext.Current.User.IsInRole("Admin"))
        //{
        //    return true;
        //}

        return true;
        //return false;
    }
}