import React from 'react';

/**
 * Shared Input Component
 * Sử dụng design system từ index.css
 * 
 * @param {string} variant - 'minimal' | 'box' | 'search'
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
const Input = React.forwardRef(({
    variant = 'box',
    size = 'md',
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}, ref) => {
    // Base classes
    const baseClasses = 'w-full transition-all duration-300 focus:outline-none focus:ring-0 placeholder:text-gray-400';
    
    // Size variants
    const sizeClasses = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-3 text-sm',
        lg: 'px-5 py-4 text-base'
    };
    
    // Variant classes
    const variantClasses = {
        // Chỉ border-bottom, minimalist style
        minimal: 'border-0 border-b border-gray-200 bg-transparent focus:border-black',
        // Full border, rounded box
        box: `border border-gray-200 bg-white rounded-xl focus:border-black ${sizeClasses[size]}`,
        // Search input với icon
        search: `border border-gray-100 bg-gray-50 rounded-full pl-10 focus:bg-white focus:border-indigo-500 ${sizeClasses[size]}`
    };

    const inputClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

    const inputElement = (
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Icon size={16} />
                </div>
            )}
            <input
                ref={ref}
                className={inputClasses}
                {...props}
            />
        </div>
    );

    if (label) {
        return (
            <div className="w-full">
                <label className="input-label">{label}</label>
                {inputElement}
                {error && (
                    <p className="mt-1 text-[10px] text-red-500 font-medium">{error}</p>
                )}
            </div>
        );
    }

    return inputElement;
});

Input.displayName = 'Input';

export default Input;
