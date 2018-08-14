using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using YoutubeK.Models;

namespace YoutubeK
{
    public class YoutubekDbContext : DbContext
    {
        public YoutubekDbContext(DbContextOptions<YoutubekDbContext> options) : base(options)
        { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }

        public DbSet<Karaoke> Karaokes { get; set; }
        public DbSet<Channel> Channels { get; set; }
        public DbSet<Room> Rooms { get; set; }
    }

    //public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<YoutubekDbContext>
    //{
    //    public YoutubekDbContext CreateDbContext(string[] args)
    //    {
    //        var path = Directory.GetCurrentDirectory();
    //        var builder = new DbContextOptionsBuilder<YoutubekDbContext>();
    //        var connectionString = $@"D:\home\site\wwwroot\Data\youtubekDb.sqlite"; //configuration.GetConnectionString("DefaultConnection");
    //        builder.UseSqlite(connectionString);
    //        return new YoutubekDbContext(builder.Options);
    //    }
    //}

}

namespace YoutubeK.Models
{

    public class Karaoke
    {
        [Key]
        public string Id { get; set; }
        public string Title { get; set; }
        public string ChannelId { get; set; }
        public string Channel { get; set; }
        public string Status { get; set; }
        public string ReplaceId { get; set; }
        public string FixBy { get; set; }
        public int IsHQ { get; set; }
        public string Flag { get; set; }
        public string FlagBy { get; set; }
        public string MetaData { get; set; }
    }

    public class Channel
    {
        [Key]
        public string Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
        public string MetaData { get; set; }
    }

    public class Room
    {
        [Key]
        public string Id { get; set; }
        public string MasterIp { get; set; }
        public string MasterKey { get; set; }
        public int GuestCount { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime? DateLastActive { get; set; }
    }
    
}
