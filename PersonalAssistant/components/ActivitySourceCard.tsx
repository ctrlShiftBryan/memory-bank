import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Card } from "./ui/Card";
import { Github, Youtube, Code } from "lucide-react-native";

interface ActivitySourceCardProps {
  title: string;
  count: number;
  icon: "github" | "youtube" | "code";
  onPress?: () => void;
}

export function ActivitySourceCard({
  title,
  count,
  icon,
  onPress,
}: ActivitySourceCardProps) {
  const icons = {
    github: <Github size={24} color="#6366f1" />,
    youtube: <Youtube size={24} color="#ef4444" />,
    code: <Code size={24} color="#10b981" />,
  };

  const colors = {
    github: "bg-indigo-50",
    youtube: "bg-red-50",
    code: "bg-green-50",
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-lg ${colors[icon]} items-center justify-center mr-3`}>
            {icons[icon]}
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-600">
              {count} {count === 1 ? "activity" : "activities"}
            </Text>
          </View>
        </View>
        <View className="w-6 h-6 items-center justify-center">
          <Text className="text-gray-400">›</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}