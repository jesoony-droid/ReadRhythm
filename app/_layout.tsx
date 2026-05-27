import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,       // 5분: 캐시 신선 유지
      gcTime: 1000 * 60 * 30,          // 30분: 메모리 캐시 유지
      refetchOnWindowFocus: false,      // 포커스 시 자동 재요청 비활성화
      refetchOnReconnect: true,         // 네트워크 재연결 시 재요청
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
