using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using Newtonsoft.Json;
using System;
using WebApplication1.Models;


namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GamesController : ControllerBase
    {
        private static readonly List<Game> Games = new();
        private static readonly Dictionary<string, DateTime> RaisedTimes = new();

        private static readonly string GamesPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "games.json");
        private static readonly string RaisedTimesPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "raisedTimes.json");

        static GamesController()
        {
            LoadGamesFromFile();
            LoadRaisedTimesFromFile();
        }

        private static void LoadGamesFromFile()
        {
            if (System.IO.File.Exists(GamesPath))
            {
                var json = System.IO.File.ReadAllText(GamesPath);
                var loadedGames = JsonConvert.DeserializeObject<List<Game>>(json);
                if (loadedGames != null)
                    Games.AddRange(loadedGames);
            }
        }

        private static void SaveGamesToFile()
        {
            var json = JsonConvert.SerializeObject(Games, Formatting.Indented);
            System.IO.File.WriteAllText(GamesPath, json);
        }

        private static void LoadRaisedTimesFromFile()
        {
            if (System.IO.File.Exists(RaisedTimesPath))
            {
                var json = System.IO.File.ReadAllText(RaisedTimesPath);
                var dict = JsonConvert.DeserializeObject<Dictionary<string, string>>(json);
                if (dict != null)
                {
                    foreach (var kvp in dict)
                    {
                        if (DateTime.TryParse(kvp.Value, out var dt))
                        {
                            RaisedTimes[kvp.Key] = dt;
                        }
                    }
                }
            }
        }

        private static void SaveRaisedTimesToFile()
        {
            var dict = RaisedTimes.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToString("o"));
            var json = JsonConvert.SerializeObject(dict, Formatting.Indented);
            System.IO.File.WriteAllText(RaisedTimesPath, json);
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            // Отдаем игры и raisedTimes (конвертируем даты в строки)
            var raisedTimesStr = RaisedTimes.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToString("o"));
            return Ok(new { games = Games, raisedTimes = raisedTimesStr });
        }

        [HttpPost("game")]
        public IActionResult AddGame([FromBody] Game game)
        {
            if (Games.Any(g => g.Name == game.Name))
                return BadRequest("Игра с таким именем уже существует.");

            // Убедимся, что у форумов есть поле timerEnabled, если нет — установим false
            if (game.Forums != null)
            {
                foreach (var f in game.Forums)
                    f.timerEnabled = f.timerEnabled; // если null, будет false (см. модель)
            }
            else
            {
                game.Forums = new List<Forum>();
            }

            Games.Add(game);
            SaveGamesToFile();
            return Ok();
        }

        [HttpPut("game")]
        public IActionResult EditGame([FromBody] Game updatedGame)
        {
            var game = Games.FirstOrDefault(g => g.Name == updatedGame.Name);
            if (game == null)
                return NotFound();

            game.Name = updatedGame.Name;
            game.Forums = updatedGame.Forums ?? new List<Forum>();

            SaveGamesToFile();
            return Ok();
        }

        [HttpDelete("game/{name}")]
        public IActionResult DeleteGame(string name)
        {
            var game = Games.FirstOrDefault(g => g.Name == name);
            if (game == null)
                return NotFound();

            Games.Remove(game);
            SaveGamesToFile();
            return Ok();
        }

        [HttpPost("forum")]
        public IActionResult AddForum([FromBody] ForumAddModel model)
        {
            var game = Games.FirstOrDefault(g => g.Name == model.GameName);
            if (game == null)
                return NotFound("Игра не найдена.");

            if (game.Forums.Any(f => f.Name == model.ForumName))
                return BadRequest("Форум с таким именем уже существует.");

            game.Forums.Add(new Forum
            {
                Name = model.ForumName,
                Link = $"https://www.{model.ForumName.ToLower()}.com",
                timerEnabled = false,
                Products = new List<Product>()
            });

            SaveGamesToFile();
            return Ok();
        }

        [HttpDelete("forum")]
        public IActionResult DeleteForum([FromQuery] string gameName, [FromQuery] string forumName)
        {
            var game = Games.FirstOrDefault(g => g.Name == gameName);
            if (game == null)
                return NotFound("Игра не найдена.");

            var forum = game.Forums.FirstOrDefault(f => f.Name == forumName);
            if (forum == null)
                return NotFound("Форум не найден.");

            game.Forums.Remove(forum);
            SaveGamesToFile();
            return Ok();
        }

        [HttpPost("product")]
        public IActionResult AddProduct([FromBody] ProductAddModel model)
        {
            var game = Games.FirstOrDefault(g => g.Name == model.GameName);
            if (game == null)
                return NotFound("Игра не найдена.");

            var forum = game.Forums.FirstOrDefault(f => f.Name == model.ForumName);
            if (forum == null)
                return NotFound("Форум не найден.");

            if (forum.Products.Any(p => p.Name == model.ProductName))
                return BadRequest("Продукт с таким именем уже существует.");

            forum.Products.Add(new Product
            {
                Name = model.ProductName,
                Link = model.ProductLink
            });

            SaveGamesToFile();
            return Ok();
        }

        [HttpDelete("product")]
        public IActionResult DeleteProduct([FromQuery] string gameName, [FromQuery] string forumName, [FromQuery] string productName)
        {
            var game = Games.FirstOrDefault(g => g.Name == gameName);
            if (game == null)
                return NotFound("Игра не найдена.");

            var forum = game.Forums.FirstOrDefault(f => f.Name == forumName);
            if (forum == null)
                return NotFound("Форум не найден.");

            var product = forum.Products.FirstOrDefault(p => p.Name == productName);
            if (product == null)
                return NotFound("Продукт не найден.");

            forum.Products.Remove(product);
            SaveGamesToFile();
            return Ok();
        }

        // Новый API: установка timerEnabled для форума
        [HttpPost("setTimerEnabled")]
        public IActionResult SetTimerEnabled([FromBody] TimerEnabledModel model)
        {
            var game = Games.FirstOrDefault(g => g.Name == model.GameName);
            if (game == null)
                return NotFound("Игра не найдена.");

            var forum = game.Forums.FirstOrDefault(f => f.Name == model.ForumName);
            if (forum == null)
                return NotFound("Форум не найден.");

            forum.timerEnabled = model.Enabled;
            SaveGamesToFile();
            return Ok();
        }

        // Новый API: отметить поднятие темы (обновить raisedTimes)
        [HttpPost("raiseTopic")]
        public IActionResult RaiseTopic([FromBody] RaiseTopicModel model)
        {
            string key = $"{model.GameName}|{model.ForumName}|{model.ProductName}";
            RaisedTimes[key] = DateTime.UtcNow;
            SaveRaisedTimesToFile();
            return Ok();
        }

        [HttpPost("clearRaisedTimesForForum")]
        public IActionResult ClearRaisedTimesForForum([FromBody] TimerEnabledModel model)
        {
            var keysToRemove = RaisedTimes.Keys
                .Where(k => k.StartsWith($"{model.GameName}|{model.ForumName}|"))
                .ToList();

            foreach (var key in keysToRemove)
            {
                RaisedTimes.Remove(key);
            }
            SaveRaisedTimesToFile();
            return Ok();
        }
    }

    // Модели для новых API
    public class TimerEnabledModel
    {
        public string GameName { get; set; } = string.Empty;
        public string ForumName { get; set; } = string.Empty;
        public bool Enabled { get; set; }
    }

    public class RaiseTopicModel
    {
        public string GameName { get; set; } = string.Empty;
        public string ForumName { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
    }
}
