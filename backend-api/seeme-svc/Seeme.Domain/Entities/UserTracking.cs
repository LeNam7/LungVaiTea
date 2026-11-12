using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Entities
{
    public class UserTracking : BaseEntity
    {
        public int UserId { get; set; }

        // Cây - Sản phẩm
        public TrackingType Type { get; set; }

        // Yêu thích  - Xem
        public TrackingAction Action { get; set; }

        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public string Image { get; set; } = string.Empty;
    }
}
