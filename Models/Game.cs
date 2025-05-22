using System.Collections.Generic;

namespace WebApplication1.Models
{
    public class Game
    {
        public string Name { get; set; } = string.Empty;
        public List<Forum> Forums { get; set; } = new();
    }
}
