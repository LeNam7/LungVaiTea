import {BRAND} from '@/constants/brand';

export type StaticPageSlug =
    | 'gioi-thieu'
    | 'chinh-sach-bao-mat'
    | 'chinh-sach-thanh-toan'
    | 'chinh-sach-giao-hang'
    | 'chinh-sach-doi-tra-bao-hanh'
    | 'dieu-khoan-su-dung';

export const STATIC_PAGES: Record<StaticPageSlug, {title: string; content: string}> = {
    'gioi-thieu': {
        title: 'Giới thiệu doanh nghiệp',
        content: `LÙNG VÀI TRÀ
Tinh hoa Trà – Trải nghiệm văn hoá – Kết nối di sản
(Thương hiệu trà gắn với vùng đất, cây trà cổ thụ và di sản văn hoá được gìn giữ qua nhiều thế hệ)

Lùng Vài Trà khởi nguồn từ tình yêu với những cây trà Shan Tuyết cổ thụ, cảnh tượng thiên nhiên hùng vĩ và bản sắc văn hóa thuần khiết của đồng bào Dao nơi núi rừng Tây Côn Lĩnh, Hà Giang. Từ vùng đất Lùng Vài, chúng tôi phát triển những sản phẩm trà mang bản sắc riêng, nâng tầm giá trị tài nguyên bản địa và mở ra không gian trải nghiệm kết nối con người với thiên nhiên, văn hóa và di sản, cùng cộng đồng gìn giữ các giá trị truyền thống và hướng tới một tương lai xanh bền vững.

![Ảnh toàn cảnh Lùng Vài](/images/gioi-thieu/toan-canh-lung-vai.jpg)

Từ cảm hứng ban đầu đến nơi gắn bó lâu dài

Câu chuyện của Lùng Vài Trà khởi nguồn từ chuyến đi Hà Giang của những người trẻ. Sức sống mãnh liệt của những cây trà Shan Tuyết cổ thụ cùng vẻ đẹp nguyên sơ của thiên nhiên và con người vùng cao đã khơi dậy trong chúng tôi khát vọng khám phá, gìn giữ và nâng tầm giá trị của một báu vật bản địa. Hành trình ấy chọn Lô Lô Chải làm điểm khởi đầu với không gian và thương hiệu SeeMe, nơi chúng tôi lắng nghe du khách, thấu hiểu sâu sắc hơn về văn hóa thưởng trà và cảm nhận trọn vẹn sức hút của du lịch gắn với bản sắc của địa phương. Đó là nền móng và động lực để chúng tôi quyết tâm xây dựng một thương hiệu trà di sản riêng đúng nghĩa.

![Ảnh cơ sở SeeMe](/images/gioi-thieu/co-so-seeme.jpg)

Quá trình tìm kiếm nguồn nguyên liệu đưa chúng tôi đến với thôn Lùng Vài, nơi có vị trí địa lý độc đáo nằm trong lòng thành phố nhưng sở hữu độ cao biệt lập cùng tập quán canh tác khép kín và văn hoá bản địa đồng nhất của cộng đồng 100% người Dao sinh sống. Vùng Trà Shan Tuyết Lùng Vài có diện tích 62 hecta, ở độ cao trung bình khoảng 1200m so với mực nước biển, trong đó có gần 10000 cây trà cổ thụ từ 50 năm đến hơn 500 năm tuổi. Nơi đây có hệ sinh thái "trà ôm ruộng bậc thang" độc đáo với những gốc trà cổ thụ uốn lượn đan xen với những thảm ruộng bậc thang trùng điệp, hút trọn dưỡng chất từ lòng đất để tạo nên hương vị đậm đà khác biệt. Cùng với Nà Thác và Khuổi My, Lùng Vài tạo thành một quần thể liên kết để khám phá trọn vẹn thiên nhiên và văn hóa trà di sản.

![Ảnh thảm ruộng bậc thang bao quanh đường lên rừng trà](/images/gioi-thieu/ruong-bac-thang-rung-tra.jpg)

Năm 2025, Lùng Vài Trà chính thức đồng hành cùng người dân bản địa, đặt xưởng chế biến ngay tại vùng nguyên liệu để bảo toàn trọn vẹn phẩm chất của từng búp trà tươi. Cùng với đó, đề án phát triển du lịch sinh thái và trải nghiệm văn hóa được xây dựng. Từ cảm hứng ban đầu, chúng tôi đang từng bước hiện thực hóa sứ mệnh nâng cao giá trị cây trà và kiến tạo tương lai bền vững cho vùng đất này.

![Ảnh xưởng trà của Lùng Vài Tea](/images/gioi-thieu/xuong-tra-lung-vai.jpg)

Tinh hoa và nghệ thuật làm trà - Sự giao hòa giữa sinh khí tự nhiên và tâm huyết nghệ nhân

Mỗi sản phẩm trà của Lùng Vài Trà đều là kết tinh thuần khiết từ tự nhiên, nói không với sự can thiệp thô bạo của con người. Nghệ thuật làm trà của chúng tôi vận hành theo tôn chỉ bảo tồn thuận theo tự nhiên dựa trên 3 trụ cột:

Triết lý canh tác “5 Không”: Không tận thu – Không cắt tỉa thô bạo – Không phân bón hóa học – Không thuốc trừ sâu – Không thuốc diệt cỏ.

Tĩnh dưỡng nguồn gốc: Cây trà được dành khoảng nghỉ tĩnh dưỡng kéo dài từ 1 đến 3 năm sau mỗi chu kỳ khai thác, nhằm bảo vệ sức sống lâu dài và duy trì nguồn nguyên liệu quý cho những sản phẩm trà đặc biệt.

Bắt trọn sinh khí: Nguyên liệu chỉ được thu hái thủ công bởi người dân bản địa vào những ngày nắng ráo, trong "khung giờ vàng" từ 7 giờ sáng đến 3 giờ chiều và được vận chuyển ngay về xưởng chế biến trong ngày để giữ trọn độ tươi nguyên và hàm lượng vi chất.

![Ảnh người dân tộc Dao Áo Dài hái trà](/images/gioi-thieu/nguoi-dao-hai-tra.jpg)

Dưới bàn tay khéo léo cùng sự chỉn chu, tâm huyết của các nghệ nhân, những búp trà Shan Tuyết non tơ tuyển chọn được chuyển hóa thành các phẩm trà thượng hạng: từ Móng Rồng hoang dã, Bạch trà thanh tao, Lục trà đượm vị núi rừng, Hồng trà ngọt ngào quyến rũ, đến Phổ Nhĩ trầm êm theo thời gian. Mỗi nhấp trà là một lần chạm vào sương giá, nắng gió đại ngàn và tình người Lùng Vài.

![Ảnh thành phẩm Lục Trà Shan Tuyết mới sao xong](/images/gioi-thieu/luc-tra-shan-tuyet.jpg)

Dấu ấn độc bản: Mỗi cây trà – Một câu chuyện – Một phẩm trà

Hàng trăm gốc trà cổ thụ bách niên tại Lùng Vài đã được lập định danh số, ghi nhận thông tin chi tiết về tọa độ, độ cao, tuổi cây và đặc tính thổ dưỡng. Lùng Vài Trà mang đến đặc quyền cá nhân hóa duy nhất dành cho những tri kỷ yêu trà:

Đồng sở hữu hoặc nhận chăm sóc cây: Khách hàng được gắn biển tên cá nhân và đồng hành cùng sự phát triển của một gốc trà riêng biệt thông qua các hình thức đăng ký chăm sóc hoặc đồng sở hữu (thuê cây và nhận sản phẩm theo mùa hoặc dài hạn).

Chế biến độc bản: Toàn bộ sản phẩm thu hái từ gốc trà đã chọn sẽ được chế biến riêng theo gu thưởng thức và phẩm cấp yêu cầu, tạo nên những sản phẩm trà độc bản mang dấu ấn cá nhân về nguồn gốc và trải nghiệm.

![Ảnh minh hoạ gốc trà cổ thụ](/images/gioi-thieu/goc-tra-co-thu.jpg)

Song song với việc nâng cao chất lượng sản phẩm, chúng tôi cũng đồng thời chuẩn hóa quy trình để xác lập Chỉ dẫn địa lý, hướng tới các Chứng nhận Hữu cơ quốc tế và chuẩn OCOP, chuẩn bị để từng bước đưa giá trị trà di sản Việt vươn ra thế giới.

Du lịch trải nghiệm di sản: Chạm vào thiên nhiên – Sống cùng văn hóa

Với chúng tôi, trà không chỉ để uống, trà còn là một lối sống, một mảnh ghép văn hoá. Chúng tôi kiến tạo những hành trình trải nghiệm chuyên sâu, đưa du khách rời xa ồn ào đô thị để hòa mình vào mạch sống đại ngàn:

Hành trình Săn Trà (Tea Trekking): Băng qua những dải rừng già, săn mây trên đỉnh núi và tự tay chạm vào những búp trà còn đọng sương sớm.

Workshop nghệ thuật trà thiền: Tự tay thu hái, tham gia vào công đoạn sao trà truyền thống và lắng nghe nghệ nhân chia sẻ về nghệ thuật thưởng trà.

Chạm vào văn hóa bản địa: Hòa mình vào đời sống thuần khiết, nguyên sơ của cộng đồng người Dao Áo Dài, thưởng thức ẩm thực vùng cao và khám phá kho tàng di sản phi vật thể.

![Ảnh minh hoạ du lịch](/images/gioi-thieu/du-lich-lung-vai.jpg)

Cam kết phát triển bền vững

Với Lùng Vài Trà, phát triển bền vững không chỉ trong những lời cam kết, mà còn được vun đắp bằng những hành động thiết thực và giá trị được tạo dựng qua thời gian.

Với sản phẩm: Chú trọng nguồn gốc, quy trình chế biến, bảo đảm tính minh bạch và chất lượng đúng theo cam kết.

Với thiên nhiên: Thúc đẩy phương thức thu hái có trách nhiệm, gìn giữ nguồn trà quý hiếm.

Với di sản: Tôn trọng và lan tỏa văn hóa, tri thức bản địa.

Với cộng đồng: Đồng hành cùng người dân bản địa, chia sẻ giá trị và tạo cơ hội sinh kế lâu dài.

Hành trình tiếp nối và lời mời từ miền di sản

Hành trình của Lùng Vài Trà vẫn đang tiếp nối, – hành trình gom góp những điều vô giá của đất trời để gửi trao đến người thưởng thức. Chúng tôi không chỉ trao đi một sản phẩm trà, chúng tôi chia sẻ một phần bản sắc văn hoá di sản.

Hẹn gặp bạn nơi miền di sản Lùng Vài. Để khám phá, để trải nghiệm, để kết nối và để bảo tồn!`,
    },
    'chinh-sach-bao-mat': {
        title: 'Chính sách bảo mật thông tin',
        content: `CHÍNH SÁCH BẢO MẬT THÔNG TIN
(Privacy Policy)

${BRAND.fullName} tôn trọng quyền riêng tư của khách hàng và cam kết bảo vệ các thông tin cá nhân được cung cấp trong quá trình sử dụng website, đặt hàng và tương tác với thương hiệu. Chính sách này giải thích cách ${BRAND.name} thu thập, sử dụng, lưu trữ và bảo vệ thông tin của khách hàng.

1. PHẠM VI ÁP DỤNG

Chính sách này áp dụng đối với tất cả khách hàng, đối tác và người dùng truy cập website, các kênh truyền thông chính thức hoặc sử dụng các dịch vụ do ${BRAND.name} cung cấp.

2. THÔNG TIN ĐƯỢC THU THẬP

${BRAND.name} có thể thu thập các thông tin sau:

* Họ và tên.
* Số điện thoại.
* Địa chỉ email.
* Địa chỉ nhận hàng.
* Thông tin thanh toán nếu có.
* Nội dung phản hồi, yêu cầu hỗ trợ hoặc các thông tin khách hàng chủ động cung cấp.

Ngoài ra, website có thể tự động thu thập một số dữ liệu kỹ thuật như địa chỉ IP, loại trình duyệt, thiết bị truy cập và lịch sử tương tác nhằm nâng cao trải nghiệm người dùng.

3. MỤC ĐÍCH THU THẬP THÔNG TIN

Thông tin khách hàng được sử dụng nhằm:

* Xử lý đơn hàng và giao sản phẩm.
* Liên hệ xác nhận đơn hàng hoặc hỗ trợ khách hàng.
* Cung cấp thông tin về sản phẩm, chương trình ưu đãi và các hoạt động của ${BRAND.name} khi khách hàng đồng ý nhận thông tin.
* Cải thiện chất lượng dịch vụ, nội dung website và trải nghiệm người dùng.
* Thực hiện các nghĩa vụ theo quy định của pháp luật.

4. THỜI GIAN LƯU TRỮ THÔNG TIN

Thông tin cá nhân được lưu trữ trong thời gian cần thiết để phục vụ mục đích thu thập hoặc cho đến khi khách hàng yêu cầu xóa dữ liệu, trừ trường hợp pháp luật có quy định khác.

5. CHIA SẺ THÔNG TIN VỚI BÊN THỨ BA

${BRAND.name} cam kết không bán, trao đổi hoặc tiết lộ thông tin cá nhân của khách hàng cho bên thứ ba vì mục đích thương mại.

Thông tin chỉ được chia sẻ trong các trường hợp:

* Đơn vị vận chuyển để thực hiện giao hàng.
* Đối tác thanh toán để xử lý giao dịch.
* Cơ quan nhà nước có thẩm quyền theo yêu cầu của pháp luật.
* Các trường hợp khác có sự đồng ý của khách hàng.

6. BẢO MẬT THÔNG TIN

${BRAND.name} áp dụng các biện pháp kỹ thuật và quản lý phù hợp nhằm bảo vệ thông tin khách hàng khỏi việc truy cập, sử dụng hoặc tiết lộ trái phép.

Mọi giao dịch thanh toán trực tuyến nếu có được thực hiện thông qua các cổng thanh toán bảo mật theo tiêu chuẩn của đối tác cung cấp dịch vụ.

7. QUYỀN CỦA KHÁCH HÀNG

Khách hàng có quyền:

* Yêu cầu xem, cập nhật hoặc điều chỉnh thông tin cá nhân.
* Yêu cầu ngừng sử dụng thông tin cho mục đích tiếp thị.
* Yêu cầu xóa hoặc hạn chế xử lý dữ liệu cá nhân theo quy định của pháp luật.
* Khiếu nại khi phát hiện thông tin cá nhân bị sử dụng sai mục đích.

8. TRÁCH NHIỆM CỦA NGƯỜI DÙNG

Khách hàng có trách nhiệm bảo mật thông tin tài khoản và các thông tin liên quan đến giao dịch của mình.

${BRAND.name} không chịu trách nhiệm đối với các thiệt hại phát sinh do khách hàng tự chia sẻ hoặc để lộ thông tin cá nhân cho bên thứ ba.

9. COOKIE VÀ CÔNG NGHỆ THEO DÕI

Website có thể sử dụng cookie nhằm ghi nhớ tùy chọn của người dùng, phân tích lưu lượng truy cập và cải thiện trải nghiệm sử dụng.

Người dùng có thể chủ động điều chỉnh hoặc từ chối cookie thông qua cài đặt trình duyệt của mình.

10. LIÊN HỆ

Mọi thắc mắc liên quan đến việc thu thập, sử dụng hoặc bảo mật thông tin cá nhân, vui lòng liên hệ:

${BRAND.fullName}

Email: ${BRAND.email}

Hotline: ${BRAND.phoneDisplay}

Địa chỉ: ${BRAND.address}

11. HIỆU LỰC

Chính sách bảo mật này có hiệu lực kể từ ngày được công bố trên website và có thể được cập nhật khi cần thiết để phù hợp với hoạt động của ${BRAND.name} và các quy định pháp luật hiện hành.`,
    },
    'chinh-sach-thanh-toan': {
        title: 'Chính sách thanh toán',
        content: `CHÍNH SÁCH THANH TOÁN
(Payment Policy)

${BRAND.fullName} cung cấp nhiều hình thức thanh toán nhằm mang đến sự thuận tiện và an toàn cho khách hàng trong quá trình mua sắm.

1. HÌNH THỨC THANH TOÁN

Khách hàng có thể lựa chọn một trong các phương thức thanh toán sau:

Thanh toán khi nhận hàng (COD)

Khách hàng thanh toán trực tiếp cho nhân viên giao hàng tại thời điểm nhận sản phẩm.

Thanh toán trực tuyến

Khách hàng thực hiện thanh toán trực tuyến thông qua cổng thanh toán điện tử được tích hợp trên website.

* Thanh toán bằng mã QR thông qua các ứng dụng ngân hàng hoặc ví điện tử được hỗ trợ.

2. QUY TRÌNH THANH TOÁN

Trước khi hoàn tất giao dịch, hệ thống sẽ hiển thị đầy đủ thông tin đơn hàng bao gồm:

* Sản phẩm đã chọn.
* Số lượng sản phẩm.
* Giá trị đơn hàng.
* Phí vận chuyển nếu có.
* Tổng số tiền thanh toán.

Khách hàng có trách nhiệm kiểm tra và xác nhận thông tin trước khi thực hiện thanh toán.

Sau khi giao dịch được hoàn tất, hệ thống sẽ gửi thông báo xác nhận đơn hàng qua các kênh liên hệ mà khách hàng đã cung cấp.

3. AN TOÀN THANH TOÁN

${BRAND.name} không lưu trữ thông tin thẻ thanh toán hoặc tài khoản ngân hàng của khách hàng trên hệ thống website.

Các giao dịch thanh toán trực tuyến được thực hiện thông qua đối tác cung cấp dịch vụ thanh toán có áp dụng các tiêu chuẩn bảo mật nhằm bảo vệ thông tin và quyền lợi của khách hàng.

4. CHI PHÍ VẬN CHUYỂN

Phí vận chuyển được tính riêng theo khu vực giao hàng và sẽ được thông báo rõ ràng trước khi khách hàng xác nhận đơn hàng.

Trong từng thời điểm, ${BRAND.name} có thể áp dụng các chương trình hỗ trợ hoặc miễn phí vận chuyển theo chính sách bán hàng hiện hành.

5. XÁC NHẬN THANH TOÁN

Đơn hàng chỉ được xem là hoàn tất khi:

* Thanh toán trực tuyến được hệ thống xác nhận thành công; hoặc
* Đơn hàng COD được khách hàng thanh toán đầy đủ khi nhận hàng.

Trong trường hợp phát sinh lỗi giao dịch hoặc sự cố kỹ thuật, ${BRAND.name} sẽ chủ động liên hệ để hỗ trợ khách hàng xử lý trong thời gian sớm nhất.

6. THÔNG TIN LIÊN HỆ

${BRAND.fullName}

Email: ${BRAND.email}

Hotline: ${BRAND.phoneDisplay}

Địa chỉ: ${BRAND.address}

Nếu có bất kỳ thắc mắc nào liên quan đến thanh toán, vui lòng liên hệ với ${BRAND.name} để được hỗ trợ.`,
    },
    'chinh-sach-giao-hang': {
        title: 'Chính sách giao hàng',
        content: `CHÍNH SÁCH GIAO HÀNG
(Shipping Policy)

${BRAND.fullName} cam kết giao sản phẩm đến tay khách hàng một cách nhanh chóng, an toàn và nguyên vẹn. Chúng tôi luôn nỗ lực tối ưu quy trình vận chuyển để mỗi đơn hàng đều mang đến trải nghiệm thuận tiện và đáng tin cậy.

1. PHẠM VI GIAO HÀNG

${BRAND.name} nhận giao hàng trên toàn lãnh thổ Việt Nam thông qua các đơn vị vận chuyển uy tín và đối tác giao hàng phù hợp với từng khu vực.

2. PHÍ VẬN CHUYỂN

Phí vận chuyển được tính dựa trên địa chỉ nhận hàng, khối lượng đơn hàng và phương thức giao nhận.

Đối với các đơn hàng đạt giá trị theo chương trình ưu đãi hiện hành, ${BRAND.name} sẽ hỗ trợ hoặc miễn phí vận chuyển theo chính sách được công bố tại thời điểm đặt hàng.

Mức phí cụ thể sẽ được hiển thị hoặc thông báo tới khách hàng trước khi đơn hàng được xác nhận.

3. THỜI GIAN GIAO HÀNG

Đối với khu vực Hà Nội:

* Các đơn hàng phát sinh trong giờ làm việc 08:00 - 17:00 có thể được hỗ trợ giao nhanh trong ngày.
* Các đơn hàng phát sinh ngoài giờ làm việc sẽ được xử lý và giao vào ngày làm việc tiếp theo.

Đối với các tỉnh, thành phố khác:

* Thời gian giao hàng dự kiến từ 02 đến 07 ngày làm việc kể từ khi đơn hàng được xác nhận.

Lưu ý: Thời gian giao hàng không bao gồm thứ Bảy, Chủ Nhật, ngày lễ, Tết hoặc các trường hợp bất khả kháng như thiên tai, dịch bệnh, gián đoạn giao thông hoặc sự cố từ đơn vị vận chuyển.

4. PHƯƠNG THỨC VẬN CHUYỂN

${BRAND.name} hợp tác với các đơn vị vận chuyển chuyên nghiệp để đảm bảo hàng hóa được giao đến khách hàng trong điều kiện tốt nhất.

Tùy từng khu vực và nhu cầu giao nhận, đơn hàng có thể được vận chuyển thông qua các đối tác giao hàng tiêu chuẩn hoặc dịch vụ giao nhanh nội thành.

5. THEO DÕI ĐƠN HÀNG

Sau khi đơn hàng được bàn giao cho đơn vị vận chuyển, khách hàng sẽ nhận được thông tin vận đơn để theo dõi quá trình giao nhận.

Trong trường hợp cần hỗ trợ, khách hàng có thể liên hệ trực tiếp với ${BRAND.name} thông qua hotline hoặc các kênh chăm sóc khách hàng chính thức.

6. QUY ĐỊNH GIAO NHẬN

Đơn vị vận chuyển sẽ liên hệ với khách hàng trước khi giao hàng.

Nếu việc giao hàng không thành công do không thể liên hệ với người nhận, đơn hàng có thể được giao lại theo quy trình của đơn vị vận chuyển.

Sau nhiều lần liên hệ không thành công, đơn hàng có thể bị hoàn về kho và hủy theo quy định.

7. KIỂM TRA HÀNG HÓA

Khách hàng được quyền kiểm tra tình trạng bên ngoài của gói hàng trước khi nhận.

Nếu phát hiện sản phẩm có dấu hiệu hư hỏng, sai hàng hoặc thiếu hàng, vui lòng phản hồi ngay cho ${BRAND.name} để được hỗ trợ xử lý trong thời gian sớm nhất.

8. TRƯỜNG HỢP GIAO HÀNG CHẬM

Trong trường hợp phát sinh chậm trễ ngoài thời gian dự kiến, ${BRAND.name} sẽ chủ động thông báo tới khách hàng.

Nếu thời gian giao hàng kéo dài đáng kể và khách hàng không còn nhu cầu nhận sản phẩm, khách hàng có quyền yêu cầu hủy đơn hàng theo quy định hiện hành.

9. HÓA ĐƠN VÀ CHỨNG TỪ

Khách hàng có thể yêu cầu hóa đơn hoặc các chứng từ liên quan đến đơn hàng theo quy định của pháp luật.

${BRAND.name} sẽ hỗ trợ cung cấp thông tin và chứng từ cần thiết trong phạm vi trách nhiệm của mình.

10. THÔNG TIN LIÊN HỆ

${BRAND.fullName}

Email: ${BRAND.email}

Hotline: ${BRAND.phoneDisplay}

Địa chỉ: ${BRAND.address}

Chúng tôi trân trọng sự tin tưởng của khách hàng và luôn nỗ lực để mỗi sản phẩm trà được giao đến tay người nhận một cách trọn vẹn nhất.`,
    },
    'chinh-sach-doi-tra-bao-hanh': {
        title: 'Chính sách đổi trả/bảo hành',
        content: `CHÍNH SÁCH BẢO HÀNH VÀ CAM KẾT CHẤT LƯỢNG

Tại ${BRAND.fullName}, chúng tôi trân trọng từng búp trà được tuyển chọn từ những cây trà Shan Tuyết cổ thụ trên vùng núi Tây Côn Lĩnh, Hà Giang. Mỗi sản phẩm đến tay khách hàng đều trải qua quy trình kiểm soát chất lượng nghiêm ngặt nhằm đảm bảo sự nguyên bản của hương vị và mang đến trải nghiệm thưởng trà trọn vẹn nhất.

Trong trường hợp phát sinh sai sót ngoài mong muốn, ${BRAND.name} cam kết hỗ trợ bảo hành, đổi trả minh bạch, nhanh chóng và công bằng để bảo vệ quyền lợi của khách hàng.

1. PHẠM VI ÁP DỤNG

Chính sách này áp dụng đối với tất cả sản phẩm được mua thông qua:

* Website chính thức của ${BRAND.fullName}.
* Các nền tảng truyền thông chính thức của ${BRAND.name}: Facebook, Instagram, Zalo, TikTok và các kênh khác do ${BRAND.name} vận hành.
* Các điểm bán hàng, đại lý hoặc đối tác được ${BRAND.name} ủy quyền.

2. TRƯỜNG HỢP ĐƯỢC HỖ TRỢ ĐỔI MỚI HOẶC HOÀN TIỀN

${BRAND.name} hỗ trợ đổi mới sản phẩm hoặc hoàn tiền trong các trường hợp:

* Sản phẩm có dấu hiệu mốc, hư hỏng hoặc không đảm bảo chất lượng ngay tại thời điểm khách hàng nhận hàng.
* Bao bì bị rách, vỡ, móp méo hoặc thấm nước trong quá trình vận chuyển.
* Giao sai sản phẩm so với đơn đặt hàng.
* Thiếu sản phẩm hoặc quà tặng đi kèm theo chương trình khuyến mại đã được xác nhận.
* Sản phẩm hết hạn sử dụng tại thời điểm giao hàng.

3. ĐIỀU KIỆN TIẾP NHẬN BẢO HÀNH

Khách hàng vui lòng cung cấp:

* Hóa đơn mua hàng hoặc thông tin đơn hàng hợp lệ.
* Hình ảnh hoặc video thể hiện tình trạng sản phẩm khi nhận hàng.
* Sản phẩm còn nguyên hiện trạng để ${BRAND.name} kiểm tra khi cần thiết.

4. THỜI HẠN TIẾP NHẬN YÊU CẦU

${BRAND.name} tiếp nhận các yêu cầu bảo hành hoặc phản ánh về sản phẩm trong vòng 07 ngày kể từ ngày khách hàng nhận được hàng.

Các yêu cầu gửi sau thời gian trên có thể không thuộc phạm vi hỗ trợ bảo hành.

5. PHƯƠNG THỨC XỬ LÝ

* Ưu tiên đổi mới sản phẩm cùng loại cho khách hàng.
* Trong trường hợp sản phẩm đã ngừng kinh doanh hoặc tạm hết hàng, khách hàng có thể lựa chọn sản phẩm khác có giá trị tương đương hoặc nhận hoàn tiền.
* ${BRAND.name} chịu toàn bộ chi phí vận chuyển phát sinh nếu lỗi được xác định thuộc về sản phẩm, quá trình đóng gói hoặc đơn vị vận chuyển.

6. CÁC TRƯỜNG HỢP KHÔNG ÁP DỤNG BẢO HÀNH

Chính sách bảo hành không áp dụng đối với các trường hợp:

* Sản phẩm bị hư hỏng do bảo quản không đúng hướng dẫn.
* Sản phẩm đã được mở niêm phong, sử dụng hoặc không còn nguyên trạng ban đầu.
* Không cung cấp được thông tin mua hàng hợp lệ.
* Hư hỏng phát sinh do tác động chủ quan từ phía người sử dụng.

7. THỜI GIAN XỬ LÝ

${BRAND.name} cam kết:

* Phản hồi yêu cầu của khách hàng trong vòng 24 giờ làm việc kể từ khi tiếp nhận thông tin.
* Hoàn tất việc xác minh và xử lý trong vòng từ 03 đến 05 ngày làm việc tùy từng trường hợp cụ thể.

Mọi thông tin khách hàng và nội dung phản ánh đều được bảo mật theo chính sách bảo mật của ${BRAND.name}.

8. THÔNG TIN LIÊN HỆ

Mọi yêu cầu hỗ trợ, vui lòng liên hệ:

${BRAND.fullName}

Hotline: ${BRAND.phoneDisplay}

Email: ${BRAND.email}

Địa chỉ: ${BRAND.address}

${BRAND.name} chân thành cảm ơn sự tin tưởng của Quý khách và cam kết không ngừng nâng cao chất lượng sản phẩm để mỗi chén trà đều mang trọn tinh thần của những cây trà Shan Tuyết cổ thụ trên vùng núi Tây Côn Lĩnh.`,
    },
    'dieu-khoan-su-dung': {
        title: 'Điều khoản sử dụng',
        content: `ĐIỀU KHOẢN SỬ DỤNG WEBSITE
(Terms of Use)

Chào mừng bạn đến với website của ${BRAND.fullName}.

Khi truy cập và sử dụng website, bạn đồng ý tuân thủ các điều khoản được quy định dưới đây. Nếu không đồng ý với bất kỳ nội dung nào trong điều khoản sử dụng, vui lòng ngừng truy cập và sử dụng website.

1. MỤC ĐÍCH HOẠT ĐỘNG CỦA WEBSITE

Website được xây dựng nhằm:

* Giới thiệu về thương hiệu ${BRAND.fullName} và các sản phẩm trà Shan Tuyết cổ thụ từ vùng núi Tây Côn Lĩnh, Hà Giang.
* Cung cấp thông tin về sản phẩm, câu chuyện thương hiệu, văn hóa trà và các hoạt động của ${BRAND.name}.
* Hỗ trợ khách hàng đặt hàng, gửi yêu cầu tư vấn và tiếp cận các chương trình ưu đãi.
* Tạo không gian kết nối giữa ${BRAND.name} và cộng đồng yêu trà.

2. QUYỀN VÀ TRÁCH NHIỆM CỦA NGƯỜI DÙNG

Khi sử dụng website, người dùng cam kết:

* Cung cấp thông tin chính xác khi thực hiện đặt hàng hoặc liên hệ với ${BRAND.name}.
* Sử dụng website đúng mục đích, tuân thủ các quy định của pháp luật Việt Nam.
* Tôn trọng quyền sở hữu trí tuệ đối với toàn bộ nội dung được đăng tải trên website.

Người dùng không được:

* Sao chép, chỉnh sửa, phát hành hoặc sử dụng hình ảnh, nội dung, thiết kế của website cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản của ${BRAND.name}.
* Thực hiện các hành vi gây ảnh hưởng đến hoạt động, tính bảo mật hoặc tính ổn định của website.
* Cung cấp thông tin sai lệch, giả mạo hoặc thực hiện các hành vi gian lận dưới mọi hình thức.

3. QUYỀN VÀ TRÁCH NHIỆM CỦA ${BRAND.name.toUpperCase()}

${BRAND.name} có quyền:

* Cập nhật, chỉnh sửa nội dung, sản phẩm, giá bán và các chính sách trên website khi cần thiết.
* Từ chối hoặc hủy đơn hàng trong trường hợp phát hiện thông tin không chính xác, dấu hiệu gian lận hoặc các trường hợp bất thường khác.
* Tạm ngừng hoạt động website để bảo trì, nâng cấp hoặc xử lý sự cố kỹ thuật.

${BRAND.name} cam kết:

* Cung cấp thông tin sản phẩm trung thực và minh bạch.
* Bảo vệ thông tin cá nhân của khách hàng theo Chính sách bảo mật.
* Nỗ lực duy trì hoạt động ổn định và an toàn cho website.

4. ĐẶT HÀNG VÀ THANH TOÁN

Khách hàng có trách nhiệm kiểm tra kỹ các thông tin liên quan đến đơn hàng trước khi xác nhận đặt mua.

Sau khi đơn hàng được ghi nhận, ${BRAND.name} sẽ liên hệ xác nhận và tiến hành xử lý theo quy trình bán hàng hiện hành.

Trong trường hợp xảy ra lỗi kỹ thuật, sai lệch thông tin hoặc các tình huống ngoài khả năng kiểm soát, ${BRAND.name} có quyền điều chỉnh hoặc hủy đơn hàng và sẽ thông báo tới khách hàng trong thời gian sớm nhất.

5. QUYỀN SỞ HỮU TRÍ TUỆ

Toàn bộ hình ảnh, nội dung, thiết kế, logo, nhận diện thương hiệu và các tài liệu trên website thuộc quyền sở hữu của ${BRAND.fullName} hoặc được sử dụng hợp pháp.

Mọi hành vi sao chép, sử dụng hoặc khai thác trái phép đều có thể bị xử lý theo quy định của pháp luật.

6. LIÊN KẾT ĐẾN BÊN THỨ BA

Website có thể chứa liên kết đến các nền tảng hoặc dịch vụ của bên thứ ba nhằm hỗ trợ trải nghiệm người dùng.

${BRAND.name} không chịu trách nhiệm đối với nội dung, chính sách bảo mật hoặc hoạt động của các website và dịch vụ nằm ngoài quyền quản lý của mình.

7. THAY ĐỔI ĐIỀU KHOẢN SỬ DỤNG

${BRAND.name} có quyền điều chỉnh hoặc cập nhật Điều khoản sử dụng vào bất kỳ thời điểm nào nhằm phù hợp với hoạt động kinh doanh và quy định pháp luật hiện hành.

Những thay đổi sẽ có hiệu lực kể từ thời điểm được công bố trên website.

8. GIẢI QUYẾT TRANH CHẤP

Mọi tranh chấp phát sinh từ việc sử dụng website sẽ được ưu tiên giải quyết trên tinh thần hợp tác và thiện chí.

Trong trường hợp không đạt được thỏa thuận, tranh chấp sẽ được giải quyết theo quy định của pháp luật Việt Nam.

9. THÔNG TIN LIÊN HỆ

${BRAND.fullName}

Email: ${BRAND.email}

Hotline: ${BRAND.phoneDisplay}

Địa chỉ: ${BRAND.address}

Cảm ơn bạn đã tin tưởng và đồng hành cùng ${BRAND.name} trên hành trình gìn giữ và lan tỏa giá trị của trà Shan Tuyết cổ thụ Tây Côn Lĩnh.`,
    },
};

export const STATIC_PAGES_EN: Partial<Record<StaticPageSlug, {title: string; content: string}>> = {
    'gioi-thieu': {
        title: 'About Us',
        content: `LUNG VAI TEA
The Essence of Tea – Cultural Experience – Heritage Connection
(A tea brand intertwined with the land, ancient tea trees, and cultural heritage preserved across generations)

Lung Vai Tea originates from a deep reverence for ancient Shan Tuyet tea trees, the majestic natural landscape, and the pure cultural heritage of the Dao people in Tay Con Linh, Ha Giang. From the legendary land of Lung Vai, we cultivate tea creations with distinctive character, elevating indigenous resources and opening an experiential space connecting people with nature, culture, and heritage — partnering with local communities to preserve traditional values and nurture a sustainable green future.

![Panoramic view of Lung Vai](/images/gioi-thieu/toan-canh-lung-vai.jpg)

From Initial Inspiration to Long-Term Commitment

The journey of Lung Vai Tea began with an expedition to Ha Giang by a passionate team of youth. The resilient vitality of centuries-old Shan Tuyet trees and the pristine beauty of the highland mountains sparked our aspiration to explore, protect, and elevate this indigenous treasure. That journey started at Lo Lo Chai with SeeMe brand space, where we listened to travelers, deepened our understanding of tea culture, and experienced firsthand the allure of community-based tourism. That foundation motivated our resolve to establish a genuine heritage tea brand.

![SeeMe facility](/images/gioi-thieu/co-so-seeme.jpg)

Our quest for raw material sources led us to Lung Vai village, endowed with a unique geography: nestled within Ha Giang city boundaries yet perched in high-altitude seclusion, practicing closed farming methods and home to an authentic 100% Dao ethnic community. The Lung Vai Shan Tuyet tea territory spans 62 hectares at an average altitude of 1,200 meters above sea level, encompassing nearly 10,000 ancient tea trees aged from 50 to over 500 years. Here thrives a unique "tea embracing terraced fields" ecosystem, where ancient root systems interweave with cascading rice terraces, absorbing pristine mountain nutrients to produce an extraordinarily rich flavor. Together with Na Thac and Khuoi My, Lung Vai forms a continuous reserve for exploring heritage tea and highland ecology.

![Terraced fields lining the path to the tea forest](/images/gioi-thieu/ruong-bac-thang-rung-tra.jpg)

In 2025, Lung Vai Tea officially partnered with indigenous artisans, establishing an on-site artisan workshop right in the harvest zone to safeguard the absolute freshness of every hand-picked bud. Concurrently, an eco-tourism and cultural experience project was launched. From early inspiration, we are realizing our mission to elevate ancient tea trees and build a flourishing, sustainable highland future.

![Lung Vai Tea processing workshop](/images/gioi-thieu/xuong-tra-lung-vai.jpg)

Artisanal Mastery — Harmony between Nature's Vital Force and Craftsman's Heart

Every product of Lung Vai Tea is a pure distillation of nature, entirely free from intrusive industrial processing. Our tea craftsmanship adheres to nature-guided preservation based on three pillars:

"5 No" Farming Philosophy: No over-harvesting – No heavy pruning – No synthetic fertilizers – No chemical pesticides – No chemical herbicides.

Root Rejuvenation: Tea trees are granted an extended restorative resting period of 1 to 3 years after each harvest cycle, safeguarding centuries-long vitality and sustaining precious harvests for exclusive reserves.

Capturing Prime Vital Energy: Tea leaves are harvested by hand exclusively by local artisans on dry, sunny days during the "golden hours" between 7:00 AM and 3:00 PM, and immediately transported to the workshop within the same day to lock in fresh vitality and high micronutrient density.

![Dao ethnic women harvesting tea](/images/gioi-thieu/nguoi-dao-hai-tra.jpg)

Under the skilled hands and dedicated passion of master artisans, tender hand-selected Shan Tuyet buds transform into extraordinary tea selections: from wild Dragon Claw, sublime White Tea, forest-scented Green Tea, sweet and captivating Black Tea, to rich Pu'er that mellows gracefully over decades. Each sip is an intimate encounter with morning frost, mountain sun, and the warm hospitality of Lung Vai.

![Freshly roasted Shan Tuyet Green Tea](/images/gioi-thieu/luc-tra-shan-tuyet.jpg)

Unique Digital Identity: Each Tree – One Story – One Masterpiece

Hundreds of century-old tea trees in Lung Vai are digitally cataloged, recording exact GPS coordinates, altitude, tree age, and soil characteristics. Lung Vai Tea provides an exclusive personalization privilege for discerning tea connoisseurs:

Co-ownership or Tree Adoption: Patrons have a personalized nameplate placed on their designated tree and accompany its growth through tree adoption or seasonal/long-term co-ownership programs.

Bespoke Tea Crafting: All leaves harvested from the patron's tree are roasted and cured according to their tailored taste and preferred tea line, yielding truly one-of-a-kind vintage batches with verifiable provenance.

![Centuries-old ancient tea tree](/images/gioi-thieu/goc-tra-co-thu.jpg)

Alongside elevating product excellence, we are standardizing geographical indications, pursuing international organic certifications, and achieving premier OCOP standards to bring Vietnamese heritage tea to the global stage.

Heritage Experience Tourism: Touching Nature – Living the Culture

For us, tea is not just a drink; it is a way of life and an integral facet of living culture. We curate immersive discovery journeys, inviting guests to leave urban rush behind and reconnect with the heartbeat of primeval forests:

Tea Trekking Expeditions: Traverse ancient forests, witness clouds rolling over mountain summits, and touch dew-glistening tea leaves with your own hands.

Tea Meditation & Artisanal Workshops: Hand-pick fresh buds, participate in traditional wood-fired pan-roasting, and listen to master artisans share tea appreciation etiquette.

Indigenous Culture Immersion: Experience the authentic, peaceful lifestyle of the Long-Tunicked Dao community, enjoy highland culinary specialties, and explore rich intangible folk heritage.

![Highland tea discovery tour](/images/gioi-thieu/du-lich-lung-vai.jpg)

Commitment to Sustainable Development

At Lung Vai Tea, sustainable growth is reflected not only in promises, but through concrete actions and enduring community impact:

Product Integrity: Transparent origin, pristine artisan processing, and strict quality fidelity.

Ecological Reverence: Responsible harvesting, protecting rare ancient genetic stocks.

Cultural Stewardship: Respecting and amplifying indigenous Dao wisdom.

Community Uplift: Empowering local villagers through sustainable livelihoods and shared prosperity.

Continuing the Journey – An Invitation from the Heritage Realm

Our journey continues — gathering the invaluable treasures of heaven and earth to share with tea connoisseurs. We offer more than sublime tea; we share an enduring piece of Vietnamese cultural heritage.

We look forward to welcoming you to Lung Vai — to explore, experience, connect, and preserve together!`,
    },
};
