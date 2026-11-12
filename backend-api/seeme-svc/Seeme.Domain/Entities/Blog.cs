using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Entities
{
    public class Blog : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string CoverImage { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? Tags { get; set; }
        public BlogType Type { get; set; } = BlogType.Default;
    }
}