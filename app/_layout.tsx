import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useSessionStore } from '../src/store/sessionStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function OnboardingGuard() {
  const router = useRouter();
  const hasHydrated = useSessionStore((s) => s._hasHydrated);
  const hasOnboarded = useSessionStore((s) => s.hasOnboarded);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!hasOnboarded) {
      router.replace('/onboarding');
    }
  }, [hasHydrated]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <OnboardingGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
