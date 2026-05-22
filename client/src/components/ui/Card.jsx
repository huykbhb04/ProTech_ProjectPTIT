import React from 'react';

/**
 * Shared Card Component
 * Sử dụng design system từ index.css
 * 
 * @param {string} variant - 'base' | 'hover' | 'glass' | 'glass-dark' | 'elevated'
 * @param {string} padding - 'none' | 'sm' | 'md' | 'lg'
 */
const Card = ({
    children,
    variant = 'base',
    padding = 'md',
    className = '',
    onClick,
    ...props
}) => {
    // Variant classes
    const variantClasses = {
        base: 'card-base',
        hover: 'card-hover cursor-pointer',
        glass: 'glass rounded-2xl',
        'glass-dark': 'glass-dark rounded-2xl',
        elevated: 'bg-white border border-gray-100 rounded-2xl shadow-xl',
    };

    // Padding classes
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const classes = `${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

    if (onClick) {
        return (
            <div 
                className={classes}
                onClick={onClick}
                role="button"
                tabIndex={0}
                {...props}
            >
                {children}
            </div>
        );
    }

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};

/**
 * Card Header Component
 */
export const CardHeader = ({ children, className = '', actions }) => (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
        <div>{children}</div>
        {actions && <div>{actions}</div>}
    </div>
);

/**
 * Card Title Component
 */
export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`section-label ${className}`}>{children}</h3>
);

/**
 * Card Content Component
 */
export const CardContent = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);

/**
 * Card Footer Component
 */
export const CardFooter = ({ children, className = '' }) => (
    <div className={`pt-4 border-t border-gray-100 mt-4 ${className}`}>
        {children}
    </div>
);

export default Card;
