import React from 'react';
import { clsx } from 'clsx';

const SectionHeader = ({ title, subtitle, center = true, className }) => {
    return (
        <div className={clsx("mb-12", center && "text-center", className)}>
            {subtitle && (
                <span className="block text-secondary font-semibold tracking-wide uppercase text-sm mb-2">
                    {subtitle}
                </span>
            )}
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 relative inline-block">
                {title}
                {center && (
                    <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-secondary rounded-full"></span>
                )}
                {!center && (
                    <span className="absolute -bottom-4 left-0 w-20 h-1 bg-secondary rounded-full"></span>
                )}
            </h2>
        </div>
    );
};

export default SectionHeader;
