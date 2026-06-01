// Trigger reload to load new env vars 2
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Listing = require('../models/listingModel');

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

exports.chat = async (req, res) => {
    const fs = require('fs');
    const logPath = require('path').join(__dirname, '../../server_debug.log');
    try {
        const { message, history } = req.body;

        fs.appendFileSync(logPath, `[REQUEST] ${new Date().toISOString()} - body: ${JSON.stringify(req.body)}\nHeaders: ${JSON.stringify(req.headers)}\n`);

        if (!message) {
            fs.appendFileSync(logPath, `[ERROR] message is empty\n`);
            return res.status(400).json({ message: 'Tin nhắn không được để trống' });
        }

        if (!process.env.GEMINI_API_KEY) {
            fs.appendFileSync(logPath, `[ERROR] GEMINI_API_KEY not defined in process.env\n`);
            return res.status(500).json({ message: 'Server chưa cấu hình Gemini API Key' });
        }

        // 1. Get active listings for RAG context
        const listings = await Listing.getAllActive();
        const listingsContext = listings.map(item => {
            const priceFormatted = new Intl.NumberFormat('vi-VN').format(item.rent_price || item.base_price || 0);
            return `ID Phòng: ${item.room_id || item.id}
Tiêu đề: ${item.title}
Khu trọ: ${item.building_name || 'N/A'}
Địa chỉ: ${item.address || 'N/A'}
Giá thuê: ${priceFormatted} VNĐ/tháng
Diện tích: ${item.area || 'N/A'} m2
Tiện ích: ${JSON.stringify(item.amenities || {})}
Chủ trọ: ${item.landlord_name || 'N/A'} (Độ uy tín: ${item.reputation_score || 100})`;
        }).join('\n---\n');

        // 2. Prepare system instructions
        const systemInstruction = `Bạn là trợ lý AI thông minh của PropTech, chuyên gia tư vấn thuê phòng trọ hàng đầu tại Việt Nam. Nhiệm vụ của bạn là hỗ trợ người thuê tìm phòng phù hợp, so sánh giá cả/tiện ích giữa các phòng và tư vấn các thủ tục đặt lịch xem phòng, hợp đồng.

Dưới đây là danh sách toàn bộ các phòng trọ đang hoạt động thực tế trên hệ thống của chúng tôi:
${listingsContext}

LƯU Ý BẮT BUỘC:
1. Chỉ đề xuất các phòng trọ có thực tế trong danh sách trên. Không tự ý bịa đặt thông tin phòng trọ khác.
2. Khi giới thiệu bất cứ phòng trọ nào, bắt buộc phải chèn link Markdown dẫn đến phòng trọ dưới dạng: [Chi tiết phòng trọ](/tenant/room/{room_id}) hoặc [Xem phòng](/tenant/room/{room_id}). Thay thế {room_id} bằng ID phòng trọ tương ứng. Ví dụ: [Chi tiết phòng trọ](/tenant/room/127).
3. Nếu người dùng yêu cầu so sánh các phòng trọ, hãy tạo một bảng so sánh Markdown trực quan (bao gồm Giá, Diện tích, Tiện ích nổi bật, Vị trí).
4. Nếu không tìm thấy phòng trọ nào khớp chính xác với yêu cầu của người dùng (ví dụ: khu vực không khớp hoặc vượt quá ngân sách), hãy thông báo rõ ràng và gợi ý các phòng trọ gần đúng nhất trong danh sách.
5. Luôn trả lời lịch sự, thân thiện, dễ hiểu bằng tiếng Việt và sử dụng các emoji thích hợp.`;

        // 3. Setup Gemini Model Fallback Loop
        const chatHistory = [];
        if (history && Array.isArray(history)) {
            const lastMsgs = history.slice(-10);
            lastMsgs.forEach(msg => {
                chatHistory.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });
        }

        const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
        let responseText = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                fs.appendFileSync(logPath, `[INFO] Attempting chat with model: ${modelName}\n`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemInstruction
                });

                const chatSession = model.startChat({
                    history: chatHistory
                });

                const result = await chatSession.sendMessage(message);
                responseText = result.response.text();
                fs.appendFileSync(logPath, `[SUCCESS] Model ${modelName} succeeded, response length: ${responseText.length}\n`);
                break; // Exit loop if successful
            } catch (err) {
                lastError = err;
                fs.appendFileSync(logPath, `[WARNING] Model ${modelName} failed: ${err.message}\n`);
            }
        }

        if (responseText === null) {
            throw lastError || new Error("All generative models failed");
        }

        res.json({ message: responseText });

    } catch (error) {
        fs.appendFileSync(logPath, `[EXCEPTION] ${error.message}\nStack: ${error.stack}\n`);
        res.status(500).json({
            message: 'Lỗi khi kết nối với trợ lý AI',
            error: error.message
        });
    }
};

