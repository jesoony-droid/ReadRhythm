import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../src/constants/tokens';

const ICONS: Record<string, string> = {
  home: '🏠', book: '📚', timer: '⏱', librarian: '🤖', person: '👤',
};

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>
      {ICONS[name] ?? '●'}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      {/* ── 표시 탭 (5개) ── */}
      <Tabs.Screen
        name="index"
        options={{ title: '홈', tabBarIcon: (p) => <TabIcon name="home" {...p} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: '서재', tabBarIcon: (p) => <TabIcon name="book" {...p} /> }}
      />
      <Tabs.Screen
        name="timer"
        options={{ title: '타이머', tabBarIcon: (p) => <TabIcon name="timer" {...p} /> }}
      />
      <Tabs.Screen
        name="librarian"
        options={{ title: 'AI사서', tabBarIcon: (p) => <TabIcon name="librarian" {...p} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '내정보', tabBarIcon: (p) => <TabIcon name="person" {...p} /> }}
      />

      {/* ── 숨김 탭 (탭바에서 제거, 라우트는 유지) ── */}
      <Tabs.Screen name="bgm"    options={{ href: null }} />
      <Tabs.Screen name="quotes" options={{ href: null }} />
    </Tabs>
  );
}
