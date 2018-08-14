using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Hangfire;
using Hangfire.MemoryStorage;
using YoutubeK.Services;
using Microsoft.EntityFrameworkCore;
using System.IO;
using Microsoft.AspNetCore.HttpOverrides;

namespace YoutubeK
{
    public class Startup
    {
        private IHostingEnvironment _env;

        public Startup(IHostingEnvironment env)
        {
            _env = env;
        }
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddCors(o => o.AddPolicy("CorsPolicy", builder =>
            {
                builder
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    //.WithOrigins("http://localhost:4200");
                    .AllowAnyOrigin();
            }));

            var connectionString = $@"Data Source={_env.ContentRootPath}\Data\youtubekDb.sqlite";
            services.AddDbContext<YoutubekDbContext>(options => options.UseSqlite(connectionString));

            services.AddMvc();
            services.AddSignalR();

            //var inMemory = GlobalConfiguration.Configuration.UseMemoryStorage();
            //services.AddHangfire(x => x.UseStorage(inMemory));
            services.AddHangfire(c => c.UseMemoryStorage());

            services.AddSingleton<Karaokeys>();
            services.AddScoped<ISimpleLogger, SimpleLogger>();
            services.AddScoped<IUtube, Utube>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseCors("CorsPolicy");
            app.UseSignalR(routes =>
            {
                routes.MapHub<YoutubekHub>("chat");
            });

            app.UseHangfireDashboard("/hangfire", new DashboardOptions
            {
                Authorization = new[] { new HangireDashboardAuthorizationFilter() }
            });
            app.UseHangfireServer();

            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");

                routes.MapRoute(
                    name: "FixEmbed",
                    template: "fixembed/{id?}/{rid?}",
                    defaults: new { controller = "Youtube", action = "fixembed" });

                routes.MapRoute(
                    name: "AddChannel",
                    template: "channel/{ChannelId?}",
                    defaults: new { controller = "Youtube", action = "AddChannel" });

                routes.MapRoute(
                    name: "CreateRoom",
                    template: "{id}",
                    defaults: new { controller = "Youtube", action = "Index" });

            });

            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });

            // run recurring Delete job
            RecurringJob.AddOrUpdate<IUtube>(x => x.ClearVideoFolder(), Cron.HourInterval(6));
        }
    }
}
