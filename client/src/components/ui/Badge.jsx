import React from 'react';

/**
 * Shared Badge Component
 * Sử dụng design system từ index.css
 * 
 * @param {string} variant - 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'custom'
 * @param {string} size - 'sm' | 'md'
 */
const Badge = ({ 
    children, 
    variant = 'muted',
    size = 'md',
    icon: Icon,
    className = '',
    style = {}
}) => {
    // Size classes
    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-[8px]',
        md: 'px-2 py-0.5 text-[9px]'
    };

    // Variant classes từ index.css design system
    const variantClasses = {
        success: 'badge-success',
        info: 'badge-info',
        warning: 'badge-warning',
        danger: 'badge-danger',
        muted: 'badge-muted',
        // Custom cho các trường hợp đặc biệt
        premium: 'badge bg-amber-50 text-amber-700 border-amber-200',
        vip: 'badge bg-yellow-50 text-yellow-700 border-yellow-200',
        new: 'badge bg-emerald-50 text-emerald-600 border-emerald-200',
        active: 'badge bg-emerald-50 text-emerald-700 border-emerald-200',
        paused: 'badge bg-amber-50 text-amber-700 border-amber-200',
        pending: 'badge bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <span 
            className={`${variantClasses[variant] || 'badge-muted'} ${sizeClasses[size]} ${className}`}
            style={style}
        >
            {Icon && <Icon size={size === 'sm' ? 8 : 10} className="mr-1" />}
            {children}
        </span>
    );
};

/**
 * Status Badge - Tự động map status sang variant phù hợp
 */
export const StatusBadge = ({ status }) => {
    const statusMap = {
        // Confirmed/Active/Completed
        confirmed: { variant: 'success', label: 'Đã chốt' },
        completed: { variant: 'success', label: 'Hoàn thành' },
        active: { variant: 'success', label: 'Hoạt động' },
        approved: { variant: 'success', label: 'Đã duyệt' },
        paid: { variant: 'success', label: 'Đã thanh toán' },
        success: { variant: 'success', label: 'Thành công' },
        
        // Info/Neutral
        pending: { variant: 'warning', label: 'Đang chờ' },
        processing: { variant: 'warning', label: 'Đang xử lý' },
        in_progress: { variant: 'warning', label: 'Đang xử lý' },
        deposited: { variant: 'info', label: 'Đã cọc' },
        signed: { variant: 'info', label: 'Đã ký' },
        renting: { variant: 'info', label: 'Đang thuê' },
        
        // Warning
        paused: { variant: 'warning', label: 'Tạm dừng' },
        expired: { variant: 'warning', label: 'Hết hạn' },
        
        // Danger
        rejected: { variant: 'danger', label: 'Từ chối' },
        cancelled: { variant: 'danger', label: 'Đã hủy' },
        failed: { variant: 'danger', label: 'Thất bại' },
        overdue: { variant: 'danger', label: 'Quá hạn' },
        
        // Muted
        inactive: { variant: 'muted', label: 'Không hoạt động' },
        closed: { variant: 'muted', label: 'Đã đóng' },
    };

    const config = statusMap[status?.toLowerCase()] || { variant: 'muted', label: status || '—' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
};

/**
 * Role Badge - Hiển thị vai trò user
 */
export const RoleBadge = ({ role }) => {
    const roleMap = {
        admin: { variant: 'danger', label: 'Quản trị' },
        landlord: { variant: 'info', label: 'Chủ trọ' },
        tenant: { variant: 'success', label: 'Người thuê' },
        guest: { variant: 'muted', label: 'Khách' },
    };

    const config = roleMap[role?.toLowerCase()] || { variant: 'muted', label: role || '—' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default Badge;
