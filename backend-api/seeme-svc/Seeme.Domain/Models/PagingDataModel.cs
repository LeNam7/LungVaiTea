namespace Seeme.Domain.Models;

public class PagingDataModel<T>
    where T : class
{
    // Dữ liệu trả về trên 1 trang
    public List<T> Data { get; set; } = new List<T>();

    // Số lượng bản ghi
    public int TotalRecords { get; set; } = 0;

    // Số lượng trang
    public int TotalPages { get; set; } = 0;

    public PagingDataModel() { }

    public PagingDataModel(int pageSize, int totalRecordsCount, List<T> pagingData)
    {
        this.Data = pagingData;
        this.TotalRecords = totalRecordsCount;
        this.TotalPages = (int)Math.Ceiling(totalRecordsCount / (double)pageSize);
    }
}
