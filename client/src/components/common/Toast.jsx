import React from 'react';
import { Toaster } from 'react-hot-toast';
import { CircleCheck, CircleX, CircleAlert, Info, X } from 'lucide-react';

/**
 * Toast Configuration & Custom Styles
 */
export const toastConfig = {
    duration: 4000,
    position: 'top-right',
    ariaProps: {
        role: 'status',
        'aria-live': 'polite',
    },
    style: {
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: '14px',
        fontWeight: '600',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    },
    className: '',
    success: {
        duration: 3000,
        iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
        },
        style: {
            background: '#fff',
            color: '#059669',
            border: '1px solid #d1fae5',
        },
    },
    error: {
        duration: 5000,
        iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
        },
        style: {
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #fee2e2',
        },
    },
    loading: {
        iconTheme: {
            primary: '#6366f1',
            secondary: '#fff',
        },
        style: {
            background: '#fff',
            color: '#6366f1',
            border: '1px solid #e0e7ff',
        },
    },
};

/**
 * Custom Toast Functions
 */
import toast from 'react-hot-toast';

// Success Toast
export const showSuccess = (message) => {
    return toast.success(message, {
        duration: 3000,
        style: toastConfig.success.style,
    });
};

// Error Toast  
export const showError = (message) => {
    return toast.error(message, {
        duration: 5000,
        style: toastConfig.error.style,
    });
};

// Loading Toast
export const showLoading = (message = 'Đang xử lý...') => {
    return toast.loading(message, {
        style: toastConfig.loading.style,
    });
};

// Promise Toast
export const showPromise = (promise, messages = { loading: 'Đang xử lý...', success: 'Thành công!', error: 'Có lỗi xảy ra' }) => {
    return toast.promise(promise, messages, {
        success: {
            style: toastConfig.success.style,
            iconTheme: toastConfig.success.iconTheme,
        },
        error: {
            style: toastConfig.error.style,
            iconTheme: toastConfig.error.iconTheme,
        },
        loading: {
            style: toastConfig.loading.style,
            iconTheme: toastConfig.loading.iconTheme,
        },
    });
};

// Info Toast
export const showInfo = (message) => {
    return toast(message, {
        icon: <Info size={20} className="text-indigo-500" />,
        style: {
            background: '#fff',
            color: '#4f46e5',
            border: '1px solid #e0e7ff',
            ...toastConfig.style,
        },
    });
};

// Warning Toast
export const showWarning = (message) => {
    return toast(message, {
        icon: <CircleAlert size={20} className="text-amber-500" />,
        style: {
            background: '#fff',
            color: '#d97706',
            border: '1px solid #fde68a',
            ...toastConfig.style,
        },
    });
};

// Custom Toast with custom content
export const showToast = (content, options = {}) => {
    return toast(content, {
        ...toastConfig,
        ...options,
    });
};

/**
 * ToastContainer Component
 * Component này cần được render trong App.jsx
 */
export const ToastContainer = () => {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={12}
            containerClassName="font-sans"
            toastOptions={{
                className: 'toast-item',
                duration: 4000,
                style: toastConfig.style,
            }}
        />
    );
};

export default ToastContainer;
