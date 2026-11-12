namespace Seeme.Domain.Models.Product
{
    /// <summary>
    /// Số lượng đã bán của 1 sản phẩm (tính cả set quà tặng vì set quà cũng là Product).
    /// FE dùng để hiển thị cột "Đã bán" và sắp xếp "Bán chạy nhất" (dòng trà = tổng các biến thể).
    /// </summary>
    public class SoldCountModel
    {
        public int ProductId { get; set; }
        public int SoldCount { get; set; }
    }
}
