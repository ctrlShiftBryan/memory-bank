import React, { useEffect } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivityStore } from '../../stores/activityStore';
import { Card } from '../../components/ui/Card';

export default function ActivitiesScreen() {
  const { activities, fetchActivities } = useActivityStore();

  useEffect(() => {
    fetchActivities();
  }, []);

  const allActivities = [
    ...activities.github.map(a => ({ ...a, source: 'GitHub' })),
    ...activities.youtube.map(a => ({ ...a, source: 'YouTube' })),
    ...activities.local.map(a => ({ ...a, source: 'Local' })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const renderActivity = ({ item }: { item: any }) => (
    <Card className="mb-3 p-4">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-sm font-medium text-gray-600">{item.source}</Text>
        <Text className="text-xs text-gray-500">
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      <Text className="text-base font-medium text-gray-900 mb-1">{item.title}</Text>
      {item.description && (
        <Text className="text-sm text-gray-600">{item.description}</Text>
      )}
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">All Activities</Text>
        
        {allActivities.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">No activities yet. Sync to get started!</Text>
          </View>
        ) : (
          <FlatList
            data={allActivities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
