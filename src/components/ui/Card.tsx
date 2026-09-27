import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = "", footer }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>}
    </div>
  );
};

export default Card;
