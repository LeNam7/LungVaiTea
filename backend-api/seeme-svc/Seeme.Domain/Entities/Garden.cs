using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.Entities
{
    // Vườn trà
    public class Garden : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty; // Mô tả vườn hiển thị ở trang BST cây trà
        public bool IsActive { get; set; }
    }
}
