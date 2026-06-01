const nodemailer = require('nodemailer');

const getTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || (user?.includes('@gmail.com') ? 'smtp.gmail.com' : null);
    const port = Number(process.env.SMTP_PORT || (user?.includes('@gmail.com') ? 465 : 587));

    if (!host) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : null
    });
};

const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@proptech.com';

    if (!transporter) {
        console.log(`[EMAIL MOCK] Would send email to: ${to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Content (Text): ${text}`);
        return { mock: true };
    }

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text,
            html
        });
        console.log(`[EMAIL] Sent email to ${to}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
        return { error: err.message };
    }
};

/**
 * Notify landlord that their listing has been automatically hidden due to multiple reports.
 */
const notifyListingAutoHidden = async (landlordEmail, landlordName, listingTitle, reason) => {
    const subject = `[PropTech Alert] Tin đăng "${listingTitle}" của bạn đã bị tạm ẩn tự động`;
    const text = `Kính gửi ${landlordName},\n\nTin đăng "${listingTitle}" của bạn trên hệ thống đã nhận được nhiều báo cáo từ người dùng về lý do "${reason}". Hệ thống đã tự động chuyển trạng thái tin đăng sang Tạm ẩn để tiến hành đối chất và thẩm định.\n\nVui lòng truy cập Dashboard quản trị của bạn để xem chi tiết và gửi khiếu nại nếu đây là sự nhầm lẫn.\n\nTrân trọng,\nBan quản trị PropTech.`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Thông Báo Tạm Ẩn Tin Đăng Tự Động</h2>
            </div>
            <div style="padding: 20px;">
                <p>Kính gửi <strong>${landlordName}</strong>,</p>
                <p>Hệ thống tự động phát hiện tin đăng <strong>"${listingTitle}"</strong> của bạn đã nhận nhiều phản ánh bất thường về lý do: <strong>${reason}</strong>.</p>
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0;">
                    <p style="margin: 0; font-weight: bold; color: #b45309;">Trạng thái: Tạm ẩn tự động (Chờ đối chất)</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Hệ thống đã ẩn tin này khỏi giao diện tìm kiếm công khai để bảo vệ người dùng khác.</p>
                </div>
                <p>Bạn có thể vào trang quản lý của chủ nhà, xem lý do chi tiết và nhấn nút <strong>"Khiếu nại"</strong> để gửi minh chứng đối chất (hợp đồng, hình ảnh thực tế) lên Admin.</p>
                <p>Nếu cần hỗ trợ gấp, vui lòng liên hệ hotline ban quản trị.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777; text-align: center;">Đây là email tự động từ hệ thống Smart PropTech. Vui lòng không trả lời trực tiếp email này.</p>
            </div>
        </div>
    `;

    return sendEmail({ to: landlordEmail, subject, text, html });
};

/**
 * Notify landlord that their listing has been locked permanently.
 */
const notifyListingLocked = async (landlordEmail, landlordName, listingTitle, reason) => {
    const subject = `[PropTech Penalty] Tin đăng "${listingTitle}" của bạn đã bị khóa vĩnh viễn`;
    const text = `Kính gửi ${landlordName},\n\nSau quá trình thẩm định và đối chất các phản ánh từ khách thuê, Ban quản trị PropTech quyết định KHÓA VĨNH VIỄN tin đăng "${listingTitle}" do vi phạm quy định: ${reason}.\n\nĐiểm uy tín của bạn đã bị khấu trừ. Nếu bạn tiếp tục có hành vi vi phạm, tài khoản sẽ bị khóa vĩnh viễn.\n\nTrân trọng,\nBan quản trị PropTech.`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Thông Báo Khóa Tin Đăng Vĩnh Viễn</h2>
            </div>
            <div style="padding: 20px;">
                <p>Kính gửi <strong>${landlordName}</strong>,</p>
                <p>Ban quản trị PropTech đã xem xét phản ánh và đưa ra quyết định xử lý đối với tin đăng <strong>"${listingTitle}"</strong> của bạn.</p>
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0;">
                    <p style="margin: 0; font-weight: bold; color: #991b1b;">Trạng thái: Khóa vĩnh viễn (Locked)</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Lý do xử phạt: ${reason}</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">Điểm uy tín chủ trọ: Bị trừ 20 điểm.</p>
                </div>
                <p>Nếu bạn cho rằng quyết định này chưa thỏa đáng, vui lòng gửi khiếu nại kèm hình ảnh hoặc hợp đồng gốc làm bằng chứng từ trang quản lý tin đăng của chủ trọ.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777; text-align: center;">PropTech hướng tới xây dựng sàn bất động sản thuần chính chủ và minh bạch.</p>
            </div>
        </div>
    `;

    return sendEmail({ to: landlordEmail, subject, text, html });
};

/**
 * Notify landlord that their account has been blocked.
 */
const notifyAccountBlocked = async (landlordEmail, landlordName, reason) => {
    const subject = `[PropTech Penalty] Tài khoản chủ trọ của bạn đã bị KHÓA`;
    const text = `Kính gửi ${landlordName},\n\nTài khoản của bạn trên hệ thống Smart PropTech đã bị KHÓA vĩnh viễn do vi phạm nghiêm trọng: ${reason}.\n\nTất cả các bài đăng của bạn sẽ bị gỡ xuống và bạn sẽ không thể đăng nhập hoặc thực hiện bất kỳ giao dịch nào trên hệ thống.\n\nTrân trọng,\nBan quản trị PropTech.`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #7f1d1d; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Thông Báo Khóa Tài Khoản Vĩnh Viễn</h2>
            </div>
            <div style="padding: 20px;">
                <p>Kính gửi <strong>${landlordName}</strong>,</p>
                <p>Chúng tôi rất tiếc phải thông báo rằng tài khoản chủ trọ đăng ký dưới email <strong>${landlordEmail}</strong> của bạn đã bị <strong>KHÓA VĨNH VIỄN</strong> trên hệ thống PropTech.</p>
                <div style="background-color: #fef2f2; border-left: 4px solid #7f1d1d; padding: 15px; margin: 15px 0;">
                    <p style="margin: 0; font-weight: bold; color: #7f1d1d;">Trạng thái: Tài khoản đã bị vô hiệu hóa</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Lý do xử lý: ${reason}</p>
                </div>
                <p>Mọi thắc mắc hoặc cần giải quyết tranh chấp xin liên hệ trực tiếp văn phòng ban quản trị sàn PropTech.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777; text-align: center;">© Smart PropTech Platform - Minh bạch & An toàn.</p>
            </div>
        </div>
    `;

    return sendEmail({ to: landlordEmail, subject, text, html });
};

module.exports = {
    notifyListingAutoHidden,
    notifyListingLocked,
    notifyAccountBlocked
};
