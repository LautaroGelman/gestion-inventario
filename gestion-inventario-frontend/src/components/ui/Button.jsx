import React from 'react';

/**
 * Button component with variant and size support.
 * Variants: "default", "outline"
 * Sizes: "default", "icon"
 */
export default function Button({
                                   children,
                                   variant = "default",
                                   size = "default",
                                   className = "",
                                   ...props
                               }) {
    const base = [
        "inline-flex",
        "items-center",
        "justify-center",
        "rounded-md",
        "text-sm",
        "font-medium",
        "transition-colors",
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-offset-2",
        "disabled:opacity-50",
        "disabled:pointer-events-none"
    ].join(' ');

    const variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline:
            "border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        icon: "h-8 w-8 p-0",
    };

    const variantClass = variants[variant] || variants.default;
    const sizeClass = sizes[size] || sizes.default;

    return (
        <button
            className={`${base} ${variantClass} ${sizeClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
