using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models.Blog
{
    public class UpdateBlogInput
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        public string CoverImage { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// Optional author name; service will preserve existing Author if null/empty.
        /// </summary>
        public string? Author { get; set; }

        /// <summary>
        /// Comma separated tags (optional)
        /// </summary>
        public string? Tags { get; set; }

        public BlogType Type { get; set; } = BlogType.Default;
    }
}
