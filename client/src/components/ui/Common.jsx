import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, House, CircleAlert } from 'lucide-react';

/**
 * Back Button Component - Navigate to previous page
 */
export const BackButton = ({ to, className = '' }) => (
    <button
        onClick={() => to ? window.location.href = to : window.history.back()}
        className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all active:scale-95 shadow-sm ${className}`}
    >
        <ChevronLeft size={18} />
        <span>Quay lại</span>
    </button>
);

/**
 * Breadcrumb Component - Navigation path
 */
export const Breadcrumb = ({ items, className = '' }) => (
    <nav className={`flex items-center gap-2 text-sm ${className}`}>
        <Link to="/" className="text-gray-400 hover:text-black transition-colors">
            <House size={14} />
        </Link>
        {items.map((item, index) => (
            <React.Fragment key={index}>
                <ChevronRight size={14} className="text-gray-300" />
                {item.path ? (
                    <Link 
                        to={item.path} 
                        className="text-gray-500 hover:text-black transition-colors font-medium"
                    >
                        {item.label}
                    </Link>
                ) : (
                    <span className="text-black font-bold">{item.label}</span>
                )}
            </React.Fragment>
        ))}
    </nav>
);

/**
 * Page Header Component - Standard page header
 */
export const PageHeader = ({ 
    label,
    title, 
    description,
    actions,
    breadcrumb,
    className = ''
}) => (
    <div className={`section-divider ${className}`}>
        {breadcrumb && <Breadcrumb items={breadcrumb} className="mb-4" />}
        <div className="flex items-end justify-between">
            <div>
                {label && <p className="section-label mb-2">{label}</p>}
                <h1 className="page-title">{title}</h1>
                {description && <p className="body-text mt-1">{description}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
        </div>
    </div>
);

/**
 * Stat Card Component - Hiển thị số liệu thống kê
 */
export const StatCard = ({ 
    title, 
    value, 
    sub, 
    icon: Icon, 
    accent = '#4f46e5',
    trend,
    trendUp = true,
    className = ''
}) => (
    <div className={`card-base p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300 ${className}`}>
        <div className="flex items-start justify-between mb-4">
            {Icon && (
                <div 
                    className="w-10 h-10 flex items-center justify-center border"
                    style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10`, color: accent }}
                >
                    <Icon size={18} />
                </div>
            )}
            <span className="section-label text-gray-300">{title}</span>
        </div>
        <p className="text-3xl font-black text-black tracking-tighter mb-1">{value ?? '—'}</p>
        {sub && <p className="meta-text text-gray-400 mt-1">{sub}</p>}
        {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                <span className="text-xs font-bold">
                    {trendUp ? '+' : ''}{trend}%
                </span>
                <span className="text-[10px] font-medium text-gray-400">vs last month</span>
            </div>
        )}
        <div 
            className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.04] group-hover:opacity-[0.07] transition-opacity"
            style={{ backgroundColor: accent }}
        />
    </div>
);

/**
 * Section Header Component
 */
export const SectionHeader = ({ 
    title, 
    action,
    actionLabel,
    onAction,
    className = ''
}) => (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
        <h3 className="section-label">{title}</h3>
        {action && onAction && (
            <button 
                onClick={onAction}
                className="text-[10px] font-black uppercase tracking-wide text-indigo-600 hover:text-black flex items-center gap-1 transition-colors"
            >
                {actionLabel || 'Xem tất cả'}
                <ChevronRight size={12} />
            </button>
        )}
    </div>
);

/**
 * Alert Component
 */
export const Alert = ({ 
    variant = 'info',
    title,
    children,
    icon: Icon = AlertCircle,
    className = ''
}) => {
    const variantClasses = {
        info: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        danger: 'bg-red-50 border-red-200 text-red-800',
    };

    const iconClasses = {
        info: 'text-indigo-500',
        success: 'text-emerald-500',
        warning: 'text-amber-500',
        danger: 'text-red-500',
    };

    return (
        <div className={`flex gap-3 p-4 border rounded-xl ${variantClasses[variant]} ${className}`}>
            <Icon size={20} className={`${iconClasses[variant]} flex-shrink-0 mt-0.5`} />
            <div>
                {title && <h4 className="font-bold text-sm mb-1">{title}</h4>}
                <div className="text-sm font-medium opacity-90">{children}</div>
            </div>
        </div>
    );
};

/**
 * Divider Component
 */
export const Divider = ({ className = '' }) => (
    <div className={`border-b border-gray-100 pb-8 mb-8 ${className}`} />
);

/**
 * Avatar Component
 */
export const Avatar = ({ 
    src, 
    name = 'User',
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    };

    const getInitials = (n) => {
        if (!n) return '?';
        return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-100 flex-shrink-0 ${className}`}>
            {src ? (
                <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                    {getInitials(name)}
                </div>
            )}
        </div>
    );
};

export default {
    BackButton,
    Breadcrumb,
    PageHeader,
    StatCard,
    SectionHeader,
    Alert,
    Divider,
    Avatar,
};
