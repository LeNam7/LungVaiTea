using System.ComponentModel.DataAnnotations;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models.Blog
{
    public class CreateBlogInput
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        public string CoverImage { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// Optional author name. If not provided controller passes current user id;
        /// service may still set Author to an identifier when needed.
        /// </summary>
        public string? Author { get; set; }

        /// <summary>
        /// Comma separated tags (optional)
        /// </summary>
        public string? Tags { get; set; }

        public BlogType Type { get; set; } = BlogType.Default;
    }
}
