const db = require('../src/config/database');

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527030280862-64139fbe04ca?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1617806118233-18e1db207f62?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?q=80&w=600&auto=format&fit=crop'
];

const LANDLORDS = [1, 40, 41, 42, 43, 44, 48];

const HN_TEMPLATES = [
  {
    title: 'Phòng trọ khép kín gần ĐH Quốc Gia, Cầu Giấy, đủ đồ, có gác lửng',
    category_id: 14, // Phòng có gác lửng
    district: 'Cầu Giấy',
    address: 'Ngõ 20 Hồ Tùng Mậu, Cầu Giấy, Hà Nội',
    base_price: 3200000,
    area: 25,
    description: 'Cho thuê phòng trọ khép kín sạch sẽ diện tích 25m2 tại ngõ 20 Hồ Tùng Mậu. Phòng thiết kế hiện đại có gác lửng rộng, ban công phơi đồ thoáng. Đầy đủ nội thất: giường tủ, điều hòa, bình nóng lạnh, kệ bếp tiện nghi. Không chung chủ, giờ giấc tự do đi lại. Gần các trường Đại học Quốc Gia, Sư Phạm, Thương Mại, đi bộ đi học cực kỳ tiện lợi.'
  },
  {
    title: 'Cho thuê phòng trọ sinh viên giá rẻ phố Chùa Bộc, gần ĐH Thủy Lợi',
    category_id: 7, // Phòng trọ sinh viên
    district: 'Đống Đa',
    address: 'Ngõ 95 Chùa Bộc, Đống Đa, Hà Nội',
    base_price: 2000000,
    area: 18,
    description: 'Chính chủ cho thuê phòng trọ khép kín giá sinh viên ngay trung tâm quận Đống Đa. Phòng ở ngõ 95 Chùa Bộc, rất gần ĐH Thủy Lợi, ĐH Công Đoàn, Học viện Ngân Hàng. Diện tích 18m2, có sẵn giường, quạt trần, kệ bếp, nhà vệ sinh riêng sạch sẽ. An ninh khu vực rất tốt, có khóa vân tay cửa ra vào chính.'
  },
  {
    title: 'Căn hộ mini cao cấp mới tinh, full nội thất tại Nguyễn Trãi, Thanh Xuân',
    category_id: 8, // Chung cư mini
    district: 'Thanh Xuân',
    address: '320 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    base_price: 4500000,
    area: 32,
    description: 'Chung cư mini mới xây cực đẹp tại 320 Nguyễn Trãi, Thanh Xuân. Căn hộ khép kín rộng 32m2 trang bị đầy đủ tủ lạnh, điều hòa, máy giặt, giường nệm cao cấp, tủ quần áo 3 cánh. Thiết kế sang trọng thoáng mát, có cửa sổ lớn đón ánh sáng tự nhiên. Tòa nhà có thang máy tốc độ cao, camera an ninh 24/7 và bãi để xe rộng rãi.'
  },
  {
    title: 'Phòng trọ không chung chủ, giờ giấc tự do tại Trung Kính, Cầu Giấy',
    category_id: 15, // Phòng không chung chủ
    district: 'Cầu Giấy',
    address: 'Hẻm 88 Trung Kính, Cầu Giấy, Hà Nội',
    base_price: 3000000,
    area: 22,
    description: 'Cho thuê phòng trọ tự do giờ giấc, khóa vân tay tự quản tại Trung Kính. Phòng sạch đẹp trang bị điều hòa, giường nệm, bàn làm việc, tủ quần áo. Có khu vực giặt phơi chung trên tầng thượng thoáng đãng. Vị trí đắc địa gần tòa nhà Keangnam, công viên Cầu Giấy, chợ và siêu thị tiện ích.'
  },
  {
    title: 'Chung cư mini ban công rộng, thoáng mát Lạc Long Quân gần Hồ Tây',
    category_id: 16, // Phòng có ban công
    district: 'Tây Hồ',
    address: '280 Lạc Long Quân, Tây Hồ, Hà Nội',
    base_price: 5500000,
    area: 35,
    description: 'Căn hộ mini siêu đẹp ngay sát Hồ Tây lộng gió. Thiết kế 1 phòng ngủ, 1 khách bếp kết hợp với ban công view ngắm cảnh siêu chill. Trang bị đầy đủ nội thất từ điều hòa, nóng lạnh, tủ lạnh, bếp từ đến máy hút mùi cao cấp. Khu vực dân trí cao, yên tĩnh, sạch sẽ, bảo vệ trực 24/24.'
  },
  {
    title: 'Cho thuê phòng trọ khép kín, an ninh tốt phố Bạch Mai, Hai Bà Trưng',
    category_id: 1, // Cho thuê phòng trọ
    district: 'Hai Bà Trưng',
    address: 'Ngõ 295 Bạch Mai, Hai Bà Trưng, Hà Nội',
    base_price: 2500000,
    area: 20,
    description: 'Cần cho thuê phòng khép kín phố Bạch Mai. Phòng rộng 20m2 ở tầng 2, sạch sẽ thoáng mát, có tủ quần áo, giường ngủ và bình nóng lạnh. Khu vực trung tâm đi lại thuận lợi gần ĐH Bách Khoa, Xây Dựng, Kinh Tế Quốc Dân. Điện nước giá nhà nước cực rẻ, phù hợp cho 2 sinh viên ở học tập.'
  },
  {
    title: 'Căn hộ dịch vụ đủ tiện nghi tại Xuân Thủy, Cầu Giấy, dọn vào ở ngay',
    category_id: 12, // Căn hộ dịch vụ
    district: 'Cầu Giấy',
    address: '136 Xuân Thủy, Cầu Giấy, Hà Nội',
    base_price: 6000000,
    area: 40,
    description: 'Cho thuê căn hộ dịch vụ cao cấp, đầy đủ các dịch vụ dọn phòng, giặt là, bảo vệ. Diện tích sử dụng 40m2 với phong cách thiết kế hiện đại, trẻ trung. Trang bị bếp điện, máy hút mùi, lò vi sóng, tủ lạnh lớn, tivi kết nối mạng tốc độ cao. Gần ga tàu điện trên cao, trung tâm thương mại IPH Xuân Thủy.'
  },
  {
    title: 'Nhà nguyên căn 3 tầng thích hợp cho nhóm sinh viên tại Đống Đa',
    category_id: 3, // Nhà nguyên căn
    district: 'Đống Đa',
    address: 'Ngõ 110 Thái Hà, Đống Đa, Hà Nội',
    base_price: 12000000,
    area: 90,
    description: 'Cho thuê nhà nguyên căn diện tích mặt sàn 30m2 x 3 tầng, tổng diện tích sử dụng 90m2 tại ngõ Thái Hà. Nhà gồm 3 phòng ngủ rộng rãi, 3 nhà vệ sinh, 1 bếp và 1 phòng khách. Có sẵn điều hòa, bình nóng lạnh cho các phòng ngủ. Phù hợp cho nhóm bạn sinh viên ở ghép hoặc hộ gia đình thuê lâu dài.'
  },
  {
    title: 'Phòng trọ cao cấp ban công riêng, có máy giặt riêng gần ĐH Bách Khoa',
    category_id: 10, // Phòng trọ cao cấp
    district: 'Hai Bà Trưng',
    address: '40 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',
    base_price: 4800000,
    area: 28,
    description: 'Cực phẩm phòng trọ cao cấp tọa lạc ngay phố Tạ Quang Bửu. Thiết kế phòng khép kín tinh tế với ban công riêng biệt trang bị máy giặt riêng, giàn phơi thông minh. Nội thất sang trọng: tủ lạnh sharp, máy lạnh daikin tiết kiệm điện, giường bọc da cao cấp. Hầm gửi xe rộng rãi tích hợp trạm sạc điện thông minh.'
  },
  {
    title: 'Tìm bạn ở ghép chung cư mini cao cấp phố Thái Hà, giá sinh viên',
    category_id: 5, // Ở ghép
    district: 'Đống Đa',
    address: 'Ngõ 180 Thái Hà, Đống Đa, Hà Nội',
    base_price: 1800000,
    area: 30,
    description: 'Mình cần tìm thêm 1 bạn nam ở ghép trong phòng chung cư mini rộng 30m2 ở Thái Hà. Phòng đã đầy đủ đồ gồm điều hòa, tủ lạnh, máy giặt, đệm. Hiện tại phòng đã có 2 người đi làm vui vẻ hòa đồng, sạch sẽ. Chi phí chia đều cực rẻ tầm 1.8tr/người bao gồm tất cả chi phí dịch vụ.'
  }
];

const HCM_TEMPLATES = [
  {
    title: 'Phòng trọ cao cấp full nội thất ngay Sư Vạn Hạnh, Quận 10, gần ĐH Huflit',
    category_id: 10, // Phòng trọ cao cấp
    district: 'Quận 10',
    address: '730 Sư Vạn Hạnh, Quận 10, TP. Hồ Chí Minh',
    base_price: 4700000,
    area: 26,
    description: 'Căn phòng cao cấp tại Sư Vạn Hạnh, Quận 10. Khu kinh doanh sầm uất, bước ra ngõ là nhà hàng, trà sữa, rạp chiếu phim Vạn Hạnh Mall. Phòng đầy đủ tiện nghi, thiết kế trẻ trung phong cách Hàn Quốc. Có sẵn máy lạnh, tủ lạnh, lò vi sóng, tủ quần áo, nệm lò xo êm ái. Giờ giấc tự do, bảo vệ giữ xe tầng trệt.'
  },
  {
    title: 'Căn hộ dịch vụ mini ban công thoáng mát Điện Biên Phủ, Bình Thạnh',
    category_id: 12, // Căn hộ dịch vụ
    district: 'Bình Thạnh',
    address: '150 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh',
    base_price: 5200000,
    area: 30,
    description: 'Căn hộ dịch vụ mới đưa vào khai thác tại Điện Biên Phủ, Bình Thạnh, sát vách Quận 1. Căn hộ có ban công đón gió mát rượi, trang bị bếp mini ấm cúng, tủ lạnh, tivi, sofa. Giá thuê đã bao gồm tiền nước, wifi tốc độ cao, dọn phòng 1 tuần/lần. Tòa nhà thang máy hiện đại, an ninh thẻ từ thang máy.'
  },
  {
    title: 'Cho thuê phòng trọ không chung chủ, có gác lửng tại Huỳnh Tấn Phát, Quận 7',
    category_id: 14, // Phòng có gác lửng
    district: 'Quận 7',
    address: '450 Huỳnh Tấn Phát, Quận 7, TP. Hồ Chí Minh',
    base_price: 3200000,
    area: 24,
    description: 'Phòng trọ có gác lửng đúc cao ráo không đụng đầu tại Quận 7. Diện tích sử dụng 24m2 rộng rãi. Thiết kế thông minh tối ưu không gian, kệ bếp nấu ăn có bồn rửa inox sạch sẽ. Có chỗ để xe an toàn ở tầng trệt. Giờ giấc hoàn toàn tự do, bạn bè tới chơi thoải mái.'
  },
  {
    title: 'Phòng trọ sinh viên giá rẻ gần ĐH Hutech, Xô Viết Nghệ Tĩnh, Bình Thạnh',
    category_id: 7, // Phòng trọ sinh viên
    district: 'Bình Thạnh',
    address: '220 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. Hồ Chí Minh',
    base_price: 2200000,
    area: 18,
    description: 'Cho thuê phòng trọ giá sinh viên gần ngay ngã tư Hàng Xanh. Thuận tiện di chuyển qua trường HUTECH, Ngoại Thương, Giao Thông Vận Tải. Phòng rộng 18m2 khép kín, sạch sẽ, có máy lạnh. Điện nước giá bình dân có đồng hồ riêng từng phòng. Thích hợp cho nhóm 2 sinh viên ở học tập.'
  },
  {
    title: 'Căn hộ dịch vụ sang xịn mịn ngay trung tâm Nguyễn Trãi, Quận 1',
    category_id: 2, // Căn hộ
    district: 'Quận 1',
    address: '180 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    base_price: 9500000,
    area: 45,
    description: 'Studio căn hộ dịch vụ cao cấp ngay lõi trung tâm Quận 1. Đầy đủ tiện ích đẳng cấp như khách sạn: nội thất gỗ sồi nhập khẩu, tivi led 55 inch, giường king-size, bồn tắm nằm massage thư giãn. Free dịch vụ giặt sấy, thay ga trải giường hàng tuần. Bảo vệ túc trực hỗ trợ 24/7 chuyên nghiệp.'
  },
  {
    title: 'Phòng trọ khép kín sạch sẽ, an ninh tốt Cộng Hòa, Tân Bình',
    category_id: 1, // Cho thuê phòng trọ
    district: 'Tân Bình',
    address: '80 Cộng Hòa, Tân Bình, TP. Hồ Chí Minh',
    base_price: 2800000,
    area: 20,
    description: 'Chính chủ cần cho thuê gấp phòng khép kín mặt tiền hẻm lớn Cộng Hòa. Phòng sạch bóng, tường ốp gạch men mát mẻ, WC riêng trang bị vòi hoa sen inox tốt. Có sân phơi nắng chung phía sau thông thoáng. Hệ thống camera giám sát quanh nhà, khóa cổng vân tay bảo mật tốt.'
  },
  {
    title: 'Studio mini full nội thất gần Lotte Mart Quận 7, Nguyễn Hữu Thọ',
    category_id: 8, // Chung cư mini
    district: 'Quận 7',
    address: '12 Nguyễn Hữu Thọ, Quận 7, TP. Hồ Chí Minh',
    base_price: 4200000,
    area: 28,
    description: 'Căn hộ studio cực kỳ xinh xắn ngay sát Lotte Mart Quận 7, đi bộ sang ĐH Tôn Đức Thắng chưa tới 5 phút. Nội thất trang bị hiện đại bao gồm máy lạnh inverter tiết kiệm điện, giường bọc nệm, bàn ăn xếp gọn thông minh, máy tắm nước nóng lạnh trực tiếp. Phù hợp cho sinh viên hoặc các bạn đi làm văn phòng.'
  },
  {
    title: 'Cho thuê căn hộ dịch vụ cao cấp có thang máy tại Bình Thạnh',
    category_id: 12, // Căn hộ dịch vụ
    district: 'Bình Thạnh',
    address: '380 Ung Văn Khiêm, Bình Thạnh, TP. Hồ Chí Minh',
    base_price: 6500000,
    area: 38,
    description: 'Cho thuê căn hộ dịch vụ thiết kế hiện đại tại Ung Văn Khiêm, Bình Thạnh. Có thang máy xịn sò, camera an ninh giám sát các tầng. Căn phòng trang bị sofa nhỏ êm ái, tivi 43 inch, máy hút mùi, tủ lạnh 2 cánh cỡ vừa. Free phí gửi xe 2 chiếc, wifi tốc độ cao mượt mà.'
  },
  {
    title: 'Phòng có gác lửng rộng rãi, giờ giấc tự do tại Cách Mạng Tháng 8, Quận 10',
    category_id: 14, // Phòng có gác lửng
    district: 'Quận 10',
    address: '540 Cách Mạng Tháng 8, Quận 10, TP. Hồ Chí Minh',
    base_price: 3500000,
    area: 25,
    description: 'Cho thuê phòng gác lửng đúc bê tông kiên cố hẻm Cách Mạng Tháng 8 gần công viên Lê Thị Riêng. Gác cao ráo mát mẻ thoải mái kê giường tủ học tập. Tầng trệt là khu vực bếp nấu ăn sạch sẽ và phòng vệ sinh rộng rãi. Nhà xe rộng free, có camera an ninh thẻ từ chống trộm.'
  },
  {
    title: 'Nhà nguyên căn sạch đẹp cho gia đình/nhóm đi làm tại Tân Bình',
    category_id: 3, // Nhà nguyên căn
    district: 'Tân Bình',
    address: 'Ngõ 25 Út Tịch, Tân Bình, TP. Hồ Chí Minh',
    base_price: 15000000,
    area: 120,
    description: 'Cho thuê nhà nguyên căn 1 trệt 2 lầu đúc thật hẻm Út Tịch, Tân Bình. Diện tích mặt sàn 40m2 x 3 tầng = 120m2. Thiết kế gồm 4 phòng ngủ lớn đều có máy lạnh riêng, 3 nhà vệ sinh, 1 phòng khách bếp liền kề thoáng mát. Phù hợp cho gia đình đông người hoặc nhóm bạn văn phòng cùng thuê tiết kiệm.'
  }
];

const AMENITIES_POOL = {
  wifi: true,
  air_conditioner: true,
  washing_machine: true,
  television: true,
  bed: true,
  wardrobe: true,
  parking: true,
  bathroom: true,
  balcony: true,
  fridge: true
};

function getRandomAmenities() {
  const am = {};
  Object.keys(AMENITIES_POOL).forEach(key => {
    if (Math.random() > 0.3) {
      am[key] = true;
    } else {
      am[key] = false;
    }
  });
  return am;
}

function getRandomImages() {
  const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 images
  const shuffled = [...UNSPLASH_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomCoordinates(city) {
  if (city === 'Hà Nội') {
    return {
      lat: 20.98 + Math.random() * 0.08,
      lng: 105.78 + Math.random() * 0.08
    };
  } else {
    return {
      lat: 10.72 + Math.random() * 0.08,
      lng: 106.62 + Math.random() * 0.08
    };
  }
}

async function seed() {
  console.log('🚀 Bắt đầu đổ thêm dữ liệu phòng từ phongtro123.com...');

  try {
    // Generate 50 mock listings (25 in Hanoi, 25 in HCMC)
    let seededCount = 0;

    for (let i = 0; i < 50; i++) {
      const isHanoi = i % 2 === 0;
      const city = isHanoi ? 'Hà Nội' : 'Hồ Chí Minh';
      const templates = isHanoi ? HN_TEMPLATES : HCM_TEMPLATES;
      
      // Select template and clone it to randomize values slightly
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const landlordId = LANDLORDS[Math.floor(Math.random() * LANDLORDS.length)];
      const coords = getRandomCoordinates(city);
      const amenities = getRandomAmenities();
      const images = getRandomImages();
      
      // Randomize values slightly for realism
      const priceOffset = (Math.floor(Math.random() * 11) - 5) * 100000; // -500k to +500k
      const rentPrice = Math.max(1500000, template.base_price + priceOffset);
      const depositAmount = rentPrice * (Math.random() > 0.5 ? 1 : 1.5);
      const areaOffset = (Math.floor(Math.random() * 7) - 3); // -3m2 to +3m2
      const area = Math.max(15, template.area + areaOffset);
      const roomNum = (Math.floor(Math.random() * 8) + 1) * 100 + Math.floor(Math.random() * 9) + 1; // 101-809
      
      // Generate randomized catchy titles to look shuffled and natural
      const titlesPrefixes = [
        'SIÊU HÓT - ', 'CHÍNH CHỦ - ', 'GẦN TRUNG TÂM - ', 'ĐỦ ĐỒ GIÁ RẺ - ', 'MỚI TINH - ', 'GIỜ GIẤC TỰ DO - ', '', ''
      ];
      const titlePrefix = titlesPrefixes[Math.floor(Math.random() * titlesPrefixes.length)];
      let finalTitle = `${titlePrefix}${template.title}`;
      if (finalTitle.length > 250) finalTitle = finalTitle.substring(0, 245) + '...';
      
      // 1. Insert building
      const buildingName = `Tòa nhà PropTech ${template.district} - ${Math.floor(Math.random() * 900) + 100}`;
      const [bResult] = await db.query(
        `INSERT INTO buildings (landlord_id, name, address_full, coordinates, security_rating, flood_risk, type, description, total_floors)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          landlordId,
          buildingName,
          template.address,
          JSON.stringify(coords),
          Math.floor(Math.random() * 4) + 7, // 7-10 security rating
          Math.random() > 0.8 ? 'low' : 'none',
          template.category_id === 2 || template.category_id === 12 ? 'apartment' : 'room',
          `Tòa nhà cho thuê cao cấp thuộc hệ thống PropTech tại khu vực ${template.district}. Hỗ trợ an ninh 24/24, dịch vụ quản lý chuyên nghiệp.`,
          Math.floor(Math.random() * 5) + 3 // 3-8 floors
        ]
      );
      
      const buildingId = bResult.insertId;
      
      // 2. Insert room
      const electricityPrice = 3500 + Math.floor(Math.random() * 3) * 250; // 3500, 3750, 4000
      const waterPrice = Math.random() > 0.5 ? 100000 : 25000; // 100k/nguoi hoặc 25k/khoi
      const servicePrice = 100000 + Math.floor(Math.random() * 4) * 50000; // 100k - 250k
      const [rResult] = await db.query(
        `INSERT INTO rooms (building_id, room_number, area, base_price, electricity_price, water_price, service_price, status, virtual_tour_url, health_score, floor, description, amenities, images)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          buildingId,
          String(roomNum),
          area,
          rentPrice,
          electricityPrice,
          waterPrice,
          servicePrice,
          'available',
          null,
          100,
          Math.floor(roomNum / 100),
          template.description,
          JSON.stringify(amenities),
          JSON.stringify(images)
        ]
      );
      
      const roomId = rResult.insertId;
      
      // 3. Insert room listing
      const views = Math.floor(Math.random() * 750) + 50; // 50 to 800 views
      const isFeatured = Math.random() > 0.85 ? 1 : 0;
      const createdDaysAgo = Math.floor(Math.random() * 25) + 1; // 1 to 25 days ago
      
      // Let's set some random listings as VIP (premium) with random premium service
      const isVip = Math.random() > 0.8;
      const premiumServiceId = isVip ? Math.floor(Math.random() * 3) + 1 : null;
      const premiumUntil = isVip ? new Date(Date.now() + (Math.floor(Math.random() * 7) + 3) * 24 * 60 * 60 * 1000) : null; // 3 to 10 days in future
      
      await db.query(
        `INSERT INTO room_listings (room_id, title, description, category_id, rent_price, deposit_amount, status, is_featured, views, created_at, updated_at, expires_at, electricity_price, water_price, service_price, amenities, max_occupants, allow_pets, premium_until, premium_service_id)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY), DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          roomId,
          finalTitle,
          template.description,
          template.category_id,
          rentPrice,
          depositAmount,
          isFeatured,
          views,
          createdDaysAgo,
          createdDaysAgo,
          electricityPrice,
          waterPrice,
          servicePrice,
          JSON.stringify(amenities),
          Math.random() > 0.7 ? 3 : 2, // 2-3 occupants
          Math.random() > 0.5 ? 1 : 0, // pets allowed
          premiumUntil,
          premiumServiceId
        ]
      );
      
      seededCount++;
    }

    console.log(`✅ Thành công! Đã đổ thêm ${seededCount} tin phòng trọ phong phú, xáo trộn ngẫu nhiên vào hệ thống.`);
  } catch (err) {
    console.error('❌ Lỗi trong quá trình đổ dữ liệu phòng:', err);
  } finally {
    process.exit(0);
  }
}

seed();
