import {MenuProps} from 'antd';
import {
    LayoutDashboard,
    Leaf,
    ShoppingBag,
    FolderTree,
    MapPin,
    Users,
    ClipboardList,
    Settings,
    Newspaper,
    BarChart3,
    Phone,
    FilePlus,
    TrendingUp,
} from 'lucide-react';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
    return {key, icon, children, label} as MenuItem;
}

export const itemsMenuCMS: MenuItem[] = [
    getItem('Báo cáo thống kê', 'group-bao-cao', <BarChart3 size={16} />, [
        getItem('Tổng quan', '/cms', <LayoutDashboard size={16} />),
        getItem('Thống kê đơn hàng', '/cms/thong-ke-don-hang', <TrendingUp size={16} />),
    ]),
    getItem('Khách hàng', '/cms/danh-sach-khach-hang', <Users size={16} />),
    getItem('Quản lý trà', 'group-cay-tra', <Leaf size={16} />, [
        getItem('Danh sách cây trà', '/cms/cay-tra', <Leaf size={16} />),
        getItem('Sản phẩm trà', '/cms/san-pham', <ShoppingBag size={16} />),
        getItem('Set quà tặng', '/cms/set-qua-tang', <ShoppingBag size={16} />),
        getItem('Vườn trà', '/cms/vuon', <MapPin size={16} />),
        getItem('Nhóm trà', '/cms/nhom-tra', <FolderTree size={16} />),
        // getItem('Quá trình trồng', '/cms/qua-trinh-trong', <Sprout size={16} />),
    ]),
    getItem('Quản lý đơn hàng', '/cms/quan-ly-don-hang', <ClipboardList size={16} />),
    getItem('Quản lý tin tức', 'group-tin-tuc', <Newspaper size={16} />, [
        getItem('Danh sách tin tức', '/cms/tin-tuc', <Newspaper size={16} />),
        getItem('Tạo mới', '/cms/tin-tuc/tao-moi', <FilePlus size={16} />),
    ]),
    getItem('Liên hệ', '/cms/lien-he', <Phone size={16} />),
    getItem('Cấu hình', '/cms/cau-hinh', <Settings size={16} />),
];

/** Map từ pathname → group key cha cần mở */
export const menuGroupKeys: Record<string, string> = {
    '/cms': 'group-bao-cao',
    '/cms/thong-ke-don-hang': 'group-bao-cao',
    '/cms/cay-tra': 'group-cay-tra',
    '/cms/san-pham': 'group-cay-tra',
    '/cms/set-qua-tang': 'group-cay-tra',
    '/cms/vuon': 'group-cay-tra',
    '/cms/nhom-tra': 'group-cay-tra',
    '/cms/qua-trinh-trong': 'group-cay-tra',
    '/cms/tin-tuc': 'group-tin-tuc',
    '/cms/tin-tuc/tao-moi': 'group-tin-tuc',
};
