import { useColorScheme } from 'react-native';
import { useAppStore } from '../stores/appStore';
import { Colors } from '../constants/Colors';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { theme, setTheme } = useAppStore();

  const resolvedTheme = (theme === 'system' ? (systemScheme ?? 'light') : theme) as 'light' | 'dark';
  const colors = Colors[resolvedTheme] || Colors.light;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme: resolvedTheme,
    colors,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}
