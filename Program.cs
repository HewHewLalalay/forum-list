using Newtonsoft.Json;
using Microsoft.AspNetCore.DataProtection;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// Добавляем поддержку контроллеров с представлениями
builder.Services.AddControllersWithViews();

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/var/www/myapp/DataProtection-Keys"))
    .SetApplicationName("MyApp");

var app = builder.Build();

app.Urls.Clear();
app.Urls.Add("http://0.0.0.0:5000");

app.UseStaticFiles();
app.UseRouting();

// Настраиваем маршрут по умолчанию на контроллер Home и метод Index
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
