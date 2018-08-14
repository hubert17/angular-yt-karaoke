using Microsoft.EntityFrameworkCore.Migrations;
using System;
using System.Collections.Generic;

namespace YoutubeK.Migrations
{
    public partial class isHq : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Channels",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    IsActive = table.Column<bool>(nullable: false),
                    MetaData = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Channels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Karaokes",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    Channel = table.Column<string>(nullable: true),
                    ChannelId = table.Column<string>(nullable: true),
                    FixBy = table.Column<string>(nullable: true),
                    Flag = table.Column<string>(nullable: true),
                    FlagBy = table.Column<string>(nullable: true),
                    IsHQ = table.Column<bool>(nullable: false),
                    MetaData = table.Column<string>(nullable: true),
                    ReplaceId = table.Column<string>(nullable: true),
                    Status = table.Column<string>(nullable: true),
                    Title = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Karaokes", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Channels");

            migrationBuilder.DropTable(
                name: "Karaokes");
        }
    }
}
