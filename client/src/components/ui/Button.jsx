import React from 'react';
import { Loader } from 'lucide-react';

/**
 * Shared Button Component
 * Sử dụng design system từ index.css
 * 
 * @param {string} variant - 'primary' | 'ghost' | 'danger' | 'action' | 'outline'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} loading - Hiển thị spinner
 * @param {string} fullWidth - 'w-full'
 */
const Button = React.forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    disabled,
    ...props
}, ref) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-black uppercase tracking-wide transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
    
    // Variant classes từ index.css design system
    const variantClasses = {
        primary: 'btn-primary',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
        action: 'btn-action',
        // Additional variants
        outline: 'border border-gray-200 text-black px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-300 inline-flex items-center gap-2',
        indigo: 'bg-indigo-600 text-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-indigo-700 active:scale-95 transition-all duration-300 inline-flex items-center gap-2',
        white: 'bg-white text-black border border-gray-200 px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-gray-50 active:scale-95 transition-all duration-300 inline-flex items-center gap-2',
    };
    
    // Size classes
    const sizeClasses = {
        sm: variant === 'action' 
            ? 'border border-gray-200 text-black px-3 py-1.5 text-[10px] font-black uppercase tracking-wide hover:bg-black hover:text-white hover:border-black transition-all duration-200 inline-flex items-center gap-1' 
            : 'px-4 py-2 text-[10px]',
        md: variantClasses[variant] || variantClasses.primary,
        lg: variant === 'action' 
            ? 'border border-gray-200 text-black px-4 py-2 text-xs font-black uppercase tracking-wide hover:bg-black hover:text-white hover:border-black transition-all duration-200 inline-flex items-center gap-2'
            : 'px-8 py-4 text-sm',
    };

    const classes = `${baseClasses} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

    return (
        <button
            ref={ref}
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader size={size === 'sm' ? 12 : 16} className="animate-spin" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 12 : 16} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 12 : 16} />}
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
