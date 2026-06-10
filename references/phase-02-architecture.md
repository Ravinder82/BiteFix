# Phase 2 — Architecture, Codebase Standards & Tooling

## 2.1 State Management Strategy

| State Type | Tool | Example |
|---|---|---|
| Server/remote state | TanStack Query | API calls, Firestore queries |
| Global UI state | Zustand | Auth, theme, notifications |
| Local component state | `useState` | Form inputs, toggles |
| Form state | React Hook Form + Zod | All forms |
| Sensitive data | `expo-secure-store` | Tokens, keys |
| Persistent app state | AsyncStorage | Onboarding, preferences |

## 2.2 Zustand Store Template

```ts
// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: '@theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

## 2.3 TanStack Query Setup

```tsx
// src/app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min
      gcTime:    10 * 60 * 1000,  // 10 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

## 2.4 Form Validation with Zod + React Hook Form

```ts
// src/utils/schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name too short').max(50, 'Name too long'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

```tsx
// Usage in screens
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
});
```

## 2.5 API Service Layer Pattern

```ts
// src/services/api/base.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync('auth_token');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  return response.json();
}

// Feature-specific service
// src/services/api/users.ts
export const usersApi = {
  getProfile:   () => apiRequest<UserProfile>('/users/me'),
  updateProfile: (data: Partial<UserProfile>) =>
    apiRequest<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
};
```

## 2.6 Error Boundary

```tsx
// src/components/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <LottieView source={require('@assets/lottie/error.json')} autoPlay loop={false} />
      <Text className="text-xl font-bold mt-4">Oops! Something went wrong</Text>
      <Text className="text-textSecondary text-center mt-2">{error.message}</Text>
      <Button label="Try Again" onPress={resetErrorBoundary} className="mt-6" />
    </View>
  );
}

export function AppErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => crashlytics().recordError(error)}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

## 2.7 Theme Hook

```ts
// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@stores/themeStore';
import { Colors } from '@constants/Colors';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { theme, setTheme } = useThemeStore();

  const resolvedTheme = theme === 'system' ? (systemScheme ?? 'light') : theme;
  const colors = Colors[resolvedTheme];

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return { theme: resolvedTheme, colors, setTheme, toggleTheme, isDark: resolvedTheme === 'dark' };
}
```

## 2.8 ESLint Config (`.eslintrc.js`)

```js
module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    }],
  },
};
```

## 2.9 Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component files | PascalCase | `UserCard.tsx` |
| Hook files | camelCase with `use` prefix | `useAuth.ts` |
| Store files | camelCase with `Store` suffix | `authStore.ts` |
| Service files | camelCase with `Service`/`Api` suffix | `userService.ts` |
| Constant files | PascalCase | `Colors.ts`, `Routes.ts` |
| Type files | PascalCase | `User.types.ts` |
| CSS classes | kebab-case (Tailwind) | `text-primary` |
| Env variables | SCREAMING_SNAKE with `EXPO_PUBLIC_` prefix | `EXPO_PUBLIC_API_URL` |
