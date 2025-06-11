import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useActivityStore } from "../../stores/activityStore";
import { ActivitySummary } from "../../components/ActivitySummary";
import { ActivitySourceCard } from "../../components/ActivitySourceCard";
import { useToast } from "../../contexts/ToastContext";

export default function DashboardScreen() {
  const { activities, summary, loading, error, fetchActivities, generateSummary, syncActivities } = useActivityStore();
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const handleSync = async () => {
    await syncActivities();
    showToast('Activities synced successfully', 'success');
  };

  const handleGenerateSummary = async () => {
    await generateSummary();
    if (!error) {
      showToast('Summary generated successfully', 'success');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Today's Overview
          </Text>
          <Text className="text-lg text-gray-600">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Button
              onPress={handleSync}
              loading={loading}
            >
              Sync Activities
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button
              onPress={handleGenerateSummary}
              loading={loading}
              variant="secondary"
            >
              Generate Summary
            </Button>
          </View>
        </View>

        {summary && (
          <Card className="mb-6 p-6 bg-white rounded-xl shadow-sm">
            <ActivitySummary summary={summary} />
          </Card>
        )}

        <View style={{ gap: 16 }}>
          <ActivitySourceCard
            title="GitHub Activity"
            count={activities.github?.length || 0}
            icon="github"
          />
          <ActivitySourceCard
            title="YouTube History"
            count={activities.youtube?.length || 0}
            icon="youtube"
          />
          <ActivitySourceCard
            title="Claude Projects"
            count={activities.local?.length || 0}
            icon="code"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
