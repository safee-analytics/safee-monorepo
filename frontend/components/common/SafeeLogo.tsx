import React from "react";

interface SafeeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
  variant?: "default" | "rounded"; // rounded adds rounded corners and white bg for better contrast
}

const sizeClasses = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
  xl: "h-16",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export const SafeeLogo: React.FC<SafeeLogoProps> = ({
  className = "",
  size = "md",
  showText = false,
  textClassName = "",
  variant = "default",
}) => {
  const logoContent = (
    <img
      src="/safee-logo.png"
      alt="Safee Analytics"
      className={`${sizeClasses[size]} w-auto ${
        variant === "rounded" ? "rounded-lg bg-white p-1" : ""
      } ${className}`}
    />
  );

  if (!showText) {
    return logoContent;
  }

  return (
    <div className="flex items-center gap-3">
      {logoContent}
      <div className={`flex flex-col leading-tight ${textClassName}`}>
        <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>Safee</span>
        <span
          className={`font-semibold text-gray-600 ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : size === "lg" ? "text-base" : "text-lg"}`}
        >
          Analytics
        </span>
      </div>
    </div>
  );
};
