const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateDescription = async (req, res) => {
    try {
        const { title, amenities, price, area, location, type = 'phòng trọ' } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'Server chưa cấu hình Gemini API Key' });
        }

        let model;
        try {
            model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        } catch (e) {
            console.log("Fallback to gemini-flash-latest");
            model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        }

        // Construct Prompt
        const prompt = `
        Bạn là một chuyên gia Copywriter Bất động sản với 10 năm kinh nghiệm.
        Hãy viết một bài đăng quảng cáo cho thuê ${type} cực kỳ hấp dẫn, chuẩn chuyên nghiệp, thu hút người xem ngay từ cái nhìn đầu tiên.
        
        Thông đầu vào:
        - Tiêu đề gốc: ${title}
        - Diện tích: ${area} m2
        - Giá thuê: ${new Intl.NumberFormat('vi-VN').format(price || 0)} VNĐ
        - Vị trí/Khu vực: ${location || 'Khu vực trung tâm'}
        - Tiện ích nổi bật: ${JSON.stringify(amenities || [])}

        Yêu cầu bắt buộc:
        1. Tiêu đề: Viết lại tiêu đề in hoa, ngắn gọn, chứa từ khóa mạnh (Ví dụ: SIÊU PHẨM, GIÁ RẺ, FULL NỘI THẤT...), có kèm icon.
        2. Cấu trúc bài viết:
           - 📍 Vị trí đắc địa: Mô tả sự thuận lợi (gần trường, chợ...).
           - 🛋 Nội thất & Tiện ích: Liệt kê hấp dẫn.
           - 💎 Ưu điểm nổi bật: Tại sao nên thuê phòng này?
           - 💰 Giá & Liên hệ: Kêu gọi hành động.
        3. Văn phong: Thân thiện, nhiệt tình, dùng nhiều emoji phù hợp để tạo điểm nhấn thị giác.
        4. Hashtags: Thêm 5-7 hashtag liên quan ở cuối bài.

        Hãy trả về kết quả dưới dạng Markdown nhưng KHÔNG dùng code block.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            res.json({ description: text });
        } catch (innerError) {
            console.error("Primary model failed, trying fallback...", innerError.message);
            // Fallback attempt
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await fallbackModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            res.json({ description: text });
        }

    } catch (error) {
        console.error('AI Generation Error FINAL:', error);
        res.status(500).json({
            message: 'Lỗi khi tạo mô tả tự động',
            error: error.message,
            details: error.response?.data || 'No details'
        });
    }
};
