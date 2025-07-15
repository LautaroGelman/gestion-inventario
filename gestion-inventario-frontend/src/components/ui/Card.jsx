import React from 'react';

/**
 * Container card
 */
export function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Card header wrapper
 */
export function CardHeader({ children, className = '', ...props }) {
    return (
        <div className={`px-4 pt-4 ${className}`} {...props}>
            {children}
        </div>
    );
}

/**
 * Title inside Card
 */
export function CardTitle({ children, className = '', ...props }) {
    return (
        <h3
            className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
            {...props}
        >
            {children}
        </h3>
    );
}

/**
 * Card content wrapper
 */
export function CardContent({ children, className = '', ...props }) {
    return (
        <div className={`px-4 pb-4 ${className}`} {...props}>
            {children}
        </div>
    );
}
