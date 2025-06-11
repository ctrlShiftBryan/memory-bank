import React from "react";
import { View, ViewProps } from "react-native";
import { clsx } from "clsx";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={clsx(
        "bg-white rounded-xl shadow-sm p-4",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}