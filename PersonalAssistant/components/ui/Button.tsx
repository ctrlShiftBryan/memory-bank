import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from "react-native";
import { clsx } from "clsx";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "default",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) {
  const variants = {
    default: "bg-blue-600 active:bg-blue-700",
    secondary: "bg-gray-200 active:bg-gray-300",
    destructive: "bg-red-600 active:bg-red-700",
    outline: "border-2 border-gray-300 bg-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2",
    lg: "px-6 py-3",
  };

  const textVariants = {
    default: "text-white",
    secondary: "text-gray-900",
    destructive: "text-white",
    outline: "text-gray-900",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style
      ]}
      className={clsx(
        "rounded-lg items-center justify-center",
        variants[variant],
        sizes[size],
        disabled && "opacity-50",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "secondary" ? "#000" : "#fff"}
        />
      ) : (
        <Text
          className={clsx(
            "font-medium",
            textVariants[variant],
            textSizes[size]
          )}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}