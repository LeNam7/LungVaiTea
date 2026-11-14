// ============================================================
// Auto-generated types from project API swagger.
// ============================================================

// ---- Enums ----

/** 1=Admin, 2=Staff, 3=Owner, 4=User */
/** Khop Seeme.Domain/Constant/Enumerations.cs phia backend. */
export enum Role {
  Admin = 1,
  Manager = 2,
  User = 3,
  Supervisor = 4,
}

/** 0=Approved, 1=Processing, 2=Shipped, 3=Completed, 4=Canceled */
export enum OrderProductStatus {
  Approved = 0,
  Processing = 1,
  Shipped = 2,
  Completed = 3,
  Canceled = 4,
}

/** 0=Approved, 1=Processing, 3=Completed */
export enum OrderTeaStatus {
  Approved = 0,
  Processing = 1,
  Completed = 3,
}

/** 1=Tea, 2=Product */
export enum TrackingType {
  Tea = 1,
  Product = 2,
}

/** 1=Like, 2=View */
export enum TrackingAction {
  Like = 1,
  View = 2,
}

/** 0=Default, 1=Hot, 2=MostViewed */
export enum BlogType {
  Default = 0,
  Hot = 1,
  MostViewed = 2,
}

/** 0=Nam, 1=Nữ, 2=Khác */
export enum Gender {
  Male = 0,
  Female = 1,
  Other = 2,
}

// ---- Common models ----

export interface PaginationParam {
  orderBy?: string | null;
  keyword?: string | null;
  pageIndex?: number; // default 1
  pageSize?: number; // default 20
}

export interface PagingResult<T> {
  data: T[] | null;
  totalRecords: number;
  totalPages: number;
}

// ---- Auth ----

export interface LoginModel {
  phoneNumber?: string | null;
  password?: string | null;
}

export interface RefreshTokenModel {
  refreshToken?: string | null;
}

export interface CreateUserModel {
  phoneNumber?: string | null;
  email?: string | null;
  fullName?: string | null;
  password?: string | null;
}

export interface ChangePasswordInputModel {
  userId: number;
  oldPassword?: string | null;
  newPassword?: string | null;
}

export interface ForgotPasswordRequestModel {
  email?: string | null;
}

export interface ResetPasswordWithOtpModel {
  email?: string | null;
  otpCode?: string | null;
  newPassword?: string | null;
}

// ---- Garden ----

export interface Garden {
  /** Mã vườn theo dữ liệu Excel */
  code?: string | null;
  id?: number;
  createdDate?: string | null;
  updatedDate?: string | null;
  isDelete?: boolean;
  name?: string | null;
  nameEn?: string | null;
  address?: string | null;
  addressEn?: string | null;
  isActive?: boolean;
  /** Mô tả vườn từ API (đã bổ sung ở BE 25/10/2026), FE ưu tiên hiển thị trường này. */
  description?: string | null;
  descriptionEn?: string | null;
}

// ---- Category ----

export interface CategoryTea {
  id?: number;
  createdDate?: string | null;
  updatedDate?: string | null;
  isDelete?: boolean;
  name?: string | null;
  isActive?: boolean;
  /** Nhóm trà từ API (luc-tra, hong-tra, bach-tra, pho-nhi-song, set-qua-tang). */
  group?: string | null;
  /** Mô tả nhóm trà từ API, dùng cho mega menu. */
  description?: string | null;
  /** Ảnh đại diện danh mục do admin cấu hình (BE bổ sung 30/10/2026). */
  imageUrl?: string | null;
}

/** Nhóm trà - bản ghi thật trên API (BE bổ sung 30/10/2026, bảng TeaGroup). */
export interface TeaGroupRecord {
  id?: number;
  /** Slug - khóa nghiệp vụ, khớp giá trị CategoryTea.group (vd 'luc-tra'). */
  slug?: string | null;
  name?: string | null;
  nameEn?: string | null;
  /** Mô tả nhóm, hiện ở mega menu. */
  description?: string | null;
  descriptionEn?: string | null;
  /** Ảnh đại diện nhóm (để dùng sau). */
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  isDelete?: boolean;
}

/** 1 dòng tổng hợp số đã bán (GET /api/product/sold-counts). */
export interface SoldCount {
  productId?: number;
  soldCount?: number;
}

// ---- Tea ----

export interface Tea {
  id?: number;
  createdDate?: string | null;
  updatedDate?: string | null;
  isDelete?: boolean;
  name?: string | null;
  nameEn?: string | null;
  categoryIds?: string | null;
  price?: number;
  gardenId?: number;
  yearOld?: number;
  description?: string | null;
  descriptionEn?: string | null;
  long?: number;
  lat?: number;
  aspect?: string | null;
  isActive?: boolean;
  packageId?: number;
  sold?: boolean;
  owner?: number;
  ownershipFromDate?: string | null;
  ownershipToDate?: string | null;
  images?: string | null;
  /** Sản lượng trà của cây, đơn vị kg/cây/năm */
  volume?: number;
  /** Loại cây trà, hiện hỗ trợ "1 lá" và "2 lá" */
  type?: string | null;
  typeEn?: string | null;
}

// ---- Order ----

export interface CreateOrderRequestModel {
  deliveryInformation?: string | null;
  /** Array of order detail objects (tea or product items) */
  orderDetails?: Array<OrderTeaDetailRequest | OrderProductDetailRequest> | null;
  /** SePay transaction is not exposed in current Swagger yet. Keep optional for forward compatibility. */
  sepayTransaction?: unknown | null;
}

export interface OrderTeaDetailRequest {
  TeaId: number;
  TeaName: string;
  Price: number;
  Quantity: number;
  SpringHarvestName?: string | null;
  SpringHarvestOutput?: string | null;
  WinterHarvestName?: string | null;
  WinterHarvestOutput?: string | null;
  /** Snapshot sản lượng cây tại thời điểm đặt hàng */
  Volume?: number;
  /** Snapshot loại cây; dùng tên riêng để không trùng Type discriminator */
  TeaType?: string | null;
  FromDate: string;
  ToDate: string;
  Type: 'tea';
}

export interface OrderProductDetailRequest {
  ProductId: number;
  ProductName: string;
  Price: number;
  Quantity: number;
  Type: 'product';
  /** Tên quy cách đóng gói (set quà) để admin biết giao phân loại nào. */
  PackagingName?: string | null;
  /** Ảnh màu khách chọn (màu set quà chọn bằng ảnh). */
  ColorImage?: string | null;
  /** Tên màu khách chọn (màu cũ chưa có ảnh). */
  ColorName?: string | null;
}

// ---- Tracking ----

export interface TrackingCreatedModel {
  type?: TrackingType;
  action?: TrackingAction;
  itemId?: number;
  itemName?: string | null;
}

export interface TrackingGetModel {
  type?: TrackingType;
  action?: TrackingAction;
  itemId?: number;
}

// ---- Plant Process ----

export interface CreatePlantProgressRequest {
  teaId: number;
  /** max 200 chars */
  title: string;
  content?: string | null;
  images?: string | null;
}

export interface UpdatePlantProgressRequest {
  id: number;
  /** max 200 chars */
  title: string;
  content?: string | null;
  images?: string | null;
}

export interface PlantProgressResponse {
  id?: number;
  teaId?: number;
  ownerId?: number;
  title?: string | null;
  content?: string | null;
  images?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

// ---- Product ----

export interface Product {
  id?: number;
  createdDate?: string | null;
  updatedDate?: string | null;
  isDelete?: boolean;
  name?: string | null;
  nameEn?: string | null;
  categoryId?: number;
  /** Slug nhóm trà của sản phẩm (vd 'luc-tra') - tầng phân loại duy nhất từ pha 1 tái cấu trúc 1/11/2026, thay cho Danh mục. */
  groupId?: string | null;
  price?: number;
  total?: number;
  description?: string | null;
  descriptionEn?: string | null;
  userManual?: string | null;
  userManualEn?: string | null;
  storageInstructions?: string | null;
  storageInstructionsEn?: string | null;
  isActive?: boolean;
  images?: string | null;
  quantity?: number;
  /** Tên bao bì/quy cách từ API (mặc định "Hộp" ở BE). */
  packagingName?: string | null;
  packagingNameEn?: string | null;
  /** Tên phân biệt biến thể cùng gram (nếu admin đã nhập). */
  variantName?: string | null;
  variantNameEn?: string | null;
  /** true = set quà tặng, hiển thị dạng set quà (chọn màu, set mix). */
  isGiftSet?: boolean;
  /** Tên bộ sưu tập, ví dụ "Huyền". */
  collectionName?: string | null;
  collectionNameEn?: string | null;
  /** Màu sắc dạng "Tên:#HEX;Tên:#HEX". */
  colorOptions?: string | null;
}

// ---- User ----

export interface CreateUserByAdminInput {
  userName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: Role;
  departmentId?: number;
  phoneNumber?: string | null;
  address?: string | null;
  birthDate?: string | null;
  bio?: string | null;
  gender?: Gender;
}

export interface UpdateUserModel {
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  email?: string | null;
  bio?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  gender?: Gender;
}

// ---- Contact ----

export interface Contact {
  id?: number;
  createdDate?: string | null;
  updatedDate?: string | null;
  isDelete?: boolean;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
}

// ---- Blog ----

export interface Blog {
  id?: number;
  createdDate?: string | null;
  updatedDate?: string | null;
  isDelete?: boolean;
  title?: string | null;
  slug?: string | null;
  shortDescription?: string | null;
  content?: string | null;
  /** Ảnh đại diện (tên mới từ API) */
  coverImage?: string | null;
  /** Alias cũ - giữ để tương thích ngược */
  thumbnail?: string | null;
  images?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  /** API field for BlogType: 0=Default, 1=Hot, 2=MostViewed */
  type?: BlogType;
  /** Alias kept for compatibility with earlier frontend code. */
  blogType?: BlogType;
  viewCount?: number;
  /** Tên tác giả (tên mới từ API) */
  author?: string | null;
  /** Alias cũ - giữ để tương thích ngược */
  authorName?: string | null;
  tags?: string | null;
}

export interface BlogPaginationParam extends PaginationParam {
  isFeatured?: boolean | null;
  isActive?: boolean | null;
  /** API field for BlogType filter. Omit to get all. */
  type?: BlogType | null;
  /** Alias kept for compatibility with earlier frontend code. */
  blogType?: BlogType | null;
}

// ---- User Address ----

export interface UserAddress {
  id?: number;
  userId?: number;
  customerName?: string | null;
  cityId?: number;
  provinceId?: number;
  provinceName?: string | null;
  wardId?: number;
  wardName?: string | null;
  address?: string | null;
  phone?: string | null;
  isDefault?: boolean;
}
