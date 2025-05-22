using System.Collections.Generic;

namespace WebApplication1.Models
{
    public class Forum
    {
        public string Name { get; set; } = string.Empty;
        public string Link { get; set; } = string.Empty;
        public bool timerEnabled { get; set; } = false; // новое поле для включения таймера
        public List<Product> Products { get; set; } = new();
    }
}
