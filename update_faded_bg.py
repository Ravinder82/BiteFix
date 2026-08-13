import re

with open('src/app/(tabs)/index.tsx', 'r') as f:
    code = f.read()

# Replace the Image opacity
code = re.sub(
    r'opacity:\s*isDark\s*\?\s*0\.45\s*:\s*0\.6',
    r'opacity: isDark ? 0.25 : 0.25',
    code
)

# Replace the LinearGradient colors and stops
# Old: colors={isDark ? ['transparent', 'rgba(15, 23, 42, 0.9)', '#0F172A'] : ['transparent', 'rgba(255, 255, 255, 0.9)', '#FFFFFF']}
# New: colors={isDark ? ['rgba(15, 23, 42, 0.3)', 'rgba(15, 23, 42, 0.85)'] : ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.85)']}
code = code.replace(
    "colors={isDark ? ['transparent', 'rgba(15, 23, 42, 0.9)', '#0F172A'] : ['transparent', 'rgba(255, 255, 255, 0.9)', '#FFFFFF']}",
    "colors={isDark ? ['rgba(15, 23, 42, 0.1)', 'rgba(15, 23, 42, 0.8)'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.8)']}"
)

# Replace the start and end (to make it a softer diagonal fade)
code = code.replace(
    "start={{ x: 1, y: 0 }}\n              end={{ x: 0.1, y: 0.9 }}",
    "start={{ x: 0, y: 0 }}\n              end={{ x: 1, y: 1 }}"
)

with open('src/app/(tabs)/index.tsx', 'w') as f:
    f.write(code)
