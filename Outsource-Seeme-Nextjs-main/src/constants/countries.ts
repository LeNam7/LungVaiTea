export type CountryOption = {
    code: string;
    nameVi: string;
    nameEn: string;
    dialCode: string;
    flag: string;
};

export const COUNTRIES: CountryOption[] = [
    { code: 'US', nameVi: 'Hoa Kỳ (Mỹ)', nameEn: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', nameVi: 'Vương quốc Anh', nameEn: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'FR', nameVi: 'Pháp', nameEn: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'DE', nameVi: 'Đức', nameEn: 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'JP', nameVi: 'Nhật Bản', nameEn: 'Japan', dialCode: '+81', flag: '🇯🇵' },
    { code: 'KR', nameVi: 'Hàn Quốc', nameEn: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
    { code: 'SG', nameVi: 'Singapore', nameEn: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
    { code: 'AU', nameVi: 'Úc (Australia)', nameEn: 'Australia', dialCode: '+61', flag: '🇦🇺' },
    { code: 'CA', nameVi: 'Canada', nameEn: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'CN', nameVi: 'Trung Quốc', nameEn: 'China', dialCode: '+86', flag: '🇨🇳' },
    { code: 'TW', nameVi: 'Đài Loan', nameEn: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
    { code: 'HK', nameVi: 'Hồng Kông', nameEn: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
    { code: 'TH', nameVi: 'Thái Lan', nameEn: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
    { code: 'MY', nameVi: 'Malaysia', nameEn: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
    { code: 'IT', nameVi: 'Ý (Italy)', nameEn: 'Italy', dialCode: '+39', flag: '🇮🇹' },
    { code: 'ES', nameVi: 'Tây Ban Nha', nameEn: 'Spain', dialCode: '+34', flag: '🇪🇸' },
    { code: 'CH', nameVi: 'Thụy Sĩ', nameEn: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
    { code: 'NL', nameVi: 'Hà Lan', nameEn: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
    { code: 'SE', nameVi: 'Thụy Điển', nameEn: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
    { code: 'NO', nameVi: 'Na Uy', nameEn: 'Norway', dialCode: '+47', flag: '🇳🇴' },
    { code: 'DK', nameVi: 'Đan Mạch', nameEn: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
    { code: 'RU', nameVi: 'Nga', nameEn: 'Russia', dialCode: '+7', flag: '🇷🇺' },
    { code: 'NZ', nameVi: 'New Zealand', nameEn: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
    { code: 'AE', nameVi: 'Các Tiểu vương quốc Ả Rập Thống nhất', nameEn: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
    { code: 'IN', nameVi: 'Ấn Độ', nameEn: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'PH', nameVi: 'Philippines', nameEn: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
    { code: 'ID', nameVi: 'Indonesia', nameEn: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
    { code: 'VN', nameVi: 'Việt Nam', nameEn: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
    { code: 'OTHER', nameVi: 'Quốc gia khác', nameEn: 'Other Country', dialCode: '+', flag: '🌐' },
];

export const getCountryByCode = (code: string) => {
    return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null;
};
