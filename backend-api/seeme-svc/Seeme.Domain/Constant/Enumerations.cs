namespace Seeme.Domain.Constant;

public class Enumerations
{
    public enum Role
    {
        Admin = 1,
        Manager = 2,
        User = 3,
        Supervisor = 4,
    }
    
    public enum OrderProductStatus
    {
        Approved = 0, // Chờ xác nhận
        Processing = 1, // Đang chuẩn bị hàng
        Shipped = 2, // Đã giao
        Completed = 3, // Hoàn thành
        Canceled = 4 // Đã hủy
    }

    public enum OrderTeaStatus
    {
        Approved = 0, // Chờ xác nhận
        Processing = 1, // Đang chuẩn bị hàng
        Completed = 3 // Hoàn thành
    }

    public enum OrderType
    {
        Both = 0, // Đặt mua cả cây trà và sản phẩm
        Tea = 1, // Đặt mua cây trà
        Product = 2 // Đặt mua sản phẩm
    }

    public enum TrackingAction
    {
        Like = 1,
        View = 2
    }
    public enum TrackingType
    {
        Tree = 1,
        Product = 2
    }

    public enum BlogType
    {
        Default = 0,
        Hot = 1,
        MostViewed = 2
    }

    public enum Gender
    {
        Other = 0,
        Male = 1,
        Female = 2
    }
}
