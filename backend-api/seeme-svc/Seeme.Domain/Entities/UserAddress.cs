namespace Seeme.Domain.Entities
{
    public class UserAddress : BaseEntity
    {
        public int UserId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int CityId { get; set; }
        public int ProvinceId{ get; set; }
        public string ProvinceName{ get; set; } = string.Empty;
        public int WardId { get; set; }
        public string WardName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        // Là địa chỉ mặc định của người dùng, nếu có nhiều địa chỉ thì sẽ có 1 địa chỉ được đánh dấu là mặc định
        public bool IsDefault { get; set; } = false;
    }
}
