using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace LukeVo.SpriteMerger.Controllers
{
    public class HomeController : Controller
    {

        [Route(""), Route("home")]
        public ActionResult Index()
        {
            return this.View();
        }
        
    }
}