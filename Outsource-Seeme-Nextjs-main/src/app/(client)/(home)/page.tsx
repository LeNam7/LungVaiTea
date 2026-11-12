import React from 'react';
import SectionBanner from './components/SectionBanner';
import SectionGiaTriCotLoi from './components/SectionGiaTriCotLoi';
import SectionBoSuuTapCayTra from './components/SectionBoSuuTapCayTra';
import SectionSanPhamTraThuongHang from './components/SectionSanPhamTraThuongHang';
import SectionVideoVeChungToi from './components/SectionVideoVeChungToi';
import SectionDenThamVuon from './components/SectionDenThamVuon';
import SectionTinTuc from './components/SectionTinTuc';

export const dynamic = 'force-dynamic';

const page = () => {
    return (
        <div>
            <SectionBanner />
            <SectionGiaTriCotLoi />
            <SectionBoSuuTapCayTra />
            <SectionSanPhamTraThuongHang />
            <SectionVideoVeChungToi />
            <SectionDenThamVuon />
            <SectionTinTuc />
        </div>
    );
};

export default page;
