import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "./ui/Card";

interface ActivitySummaryProps {
  summary: {
    text: string;
    insights: {
      executiveSummary: string;
      timeAllocation: Array<{ category: string; percentage: number }>;
      productivityInsights: string[];
      keyAchievements: string[];
      areasOfConcern: string[];
    };
    priorities: string[];
  };
}

export function ActivitySummary({ summary }: ActivitySummaryProps) {
  return (
    <ScrollView className="flex-1">
      <View className="space-y-4">
        {/* Executive Summary */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Executive Summary
          </Text>
          <Text className="text-gray-700">{summary.insights.executiveSummary}</Text>
        </Card>

        {/* Time Allocation */}
        {summary.insights.timeAllocation.length > 0 && (
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Time Allocation
            </Text>
            {summary.insights.timeAllocation.map((item, index) => (
              <View key={index} className="mb-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700">{item.category}</Text>
                  <Text className="text-gray-900 font-medium">
                    {item.percentage}%
                  </Text>
                </View>
                <View className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Key Achievements */}
        {summary.insights.keyAchievements.length > 0 && (
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Key Achievements
            </Text>
            {summary.insights.keyAchievements.map((achievement, index) => (
              <View key={index} className="flex-row mb-2">
                <Text className="text-green-600 mr-2">✓</Text>
                <Text className="text-gray-700 flex-1">{achievement}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Areas of Concern */}
        {summary.insights.areasOfConcern.length > 0 && (
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Areas of Concern
            </Text>
            {summary.insights.areasOfConcern.map((concern, index) => (
              <View key={index} className="flex-row mb-2">
                <Text className="text-orange-600 mr-2">!</Text>
                <Text className="text-gray-700 flex-1">{concern}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Tomorrow's Priorities */}
        {summary.priorities.length > 0 && (
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Tomorrow's Priorities
            </Text>
            {summary.priorities.map((priority, index) => (
              <View key={index} className="flex-row mb-2">
                <Text className="text-blue-600 mr-2">{index + 1}.</Text>
                <Text className="text-gray-700 flex-1">{priority}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Productivity Insights */}
        {summary.insights.productivityInsights.length > 0 && (
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Productivity Insights
            </Text>
            {summary.insights.productivityInsights.map((insight, index) => (
              <View key={index} className="mb-2">
                <Text className="text-gray-700">• {insight}</Text>
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}