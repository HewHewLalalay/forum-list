using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers
{
    public class HomeController : Controller
    {
        // Главная страница
        public IActionResult Index()
        {
            return View();
        }
    }
}
