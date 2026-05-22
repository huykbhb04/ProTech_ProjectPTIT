import React from 'react';
import { Loader, CircleAlert, CircleCheck, CircleX } from 'lucide-react';

/**
 * Loading Spinner Component
 */
export const Spinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    };

    return (
        <Loader 
            size={size === 'sm' ? 16 : size === 'lg' ? 32 : 24} 
            className={`animate-spin text-gray-300 ${className}`} 
        />
    );
};

/**
 * Loading State Component - Hiển thị khi đang load data
 */
export const LoadingState = ({ 
    message = 'Đang tải...', 
    fullScreen = false,
    className = '' 
}) => {
    const containerClass = fullScreen 
        ? 'min-h-screen flex flex-col items-center justify-center gap-3'
        : 'flex flex-col items-center justify-center py-12 gap-3';

    return (
        <div className={containerClass}>
            <Spinner size="lg" />
            <p className="section-label text-gray-400">{message}</p>
        </div>
    );
};

/**
 * Empty State Component - Hiển thị khi không có data
 */
export const EmptyState = ({ 
    icon: Icon,
    title = 'Không có dữ liệu',
    description = '',
    action,
    actionLabel,
    className = ''
}) => (
    <div className={`py-24 text-center ${className}`}>
        {Icon && (
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon size={32} className="text-gray-300" />
            </div>
        )}
        <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
        {description && (
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">{description}</p>
        )}
        {action && actionLabel && (
            <button
                onClick={action}
                className="px-10 py-4 bg-black text-white font-black text-[10px] uppercase tracking-widest hover:-translate-y-1 transition-all"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

/**
 * Error State Component - Hiển thị khi có lỗi
 */
export const ErrorState = ({ 
    message = 'Đã xảy ra lỗi', 
    onRetry,
    className = '' 
}) => (
    <div className={`py-16 text-center ${className}`}>
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CircleX size={28} className="text-red-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">Oops! Có lỗi xảy ra</h3>
        <p className="text-gray-500 font-medium text-sm mb-6">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="px-6 py-3 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all"
            >
                Thử lại
            </button>
        )}
    </div>
);

/**
 * Success State Component
 */
export const SuccessState = ({ 
    message = 'Thành công!',
    className = '' 
}) => (
    <div className={`py-12 text-center ${className}`}>
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CircleCheck size={28} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">{message}</h3>
    </div>
);

/**
 * Skeleton Loader Component - Placeholder khi load
 */
export const Skeleton = ({ 
    variant = 'text',
    width,
    height,
    className = '' 
}) => {
    const variantClasses = {
        text: 'h-4 rounded',
        title: 'h-6 rounded',
        avatar: 'w-10 h-10 rounded-full',
        thumbnail: 'aspect-video rounded-xl',
        card: 'h-32 rounded-2xl',
    };

    return (
        <div 
            className={`bg-gray-100 animate-pulse ${variantClasses[variant]} ${className}`}
            style={{ width, height }}
        />
    );
};

/**
 * Skeleton Card - Placeholder cho card
 */
export const SkeletonCard = ({ className = '' }) => (
    <div className={`card-base p-6 ${className}`}>
        <div className="flex items-start justify-between mb-4">
            <Skeleton variant="avatar" />
            <Skeleton width={80} height={16} />
        </div>
        <Skeleton variant="title" className="mb-2" />
        <Skeleton width="60%" className="mb-4" />
        <div className="flex gap-2">
            <Skeleton width={60} height={24} className="rounded" />
            <Skeleton width={60} height={24} className="rounded" />
        </div>
    </div>
);

export default Spinner;
