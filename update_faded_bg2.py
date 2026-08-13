import re

with open('src/app/(tabs)/index.tsx', 'r') as f:
    code = f.read()

# Replace the start and end (to make it a softer diagonal fade)
code = code.replace(
    "start={{ x: 0, y: 0 }}\n              end={{ x: 1, y: 1 }}",
    "start={{ x: 1, y: 0 }}\n              end={{ x: 0, y: 1 }}"
)

# And let's make the opacity slightly higher so the image is more visible, but the gradient mask is stronger at the bottom
code = code.replace(
    "opacity: isDark ? 0.25 : 0.25",
    "opacity: isDark ? 0.4 : 0.5"
)

# And adjust the gradient to be a bit more solid at the bottom
code = code.replace(
    "colors={isDark ? ['rgba(15, 23, 42, 0.1)', 'rgba(15, 23, 42, 0.8)'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.8)']}",
    "colors={isDark ? ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.95)']}"
)

with open('src/app/(tabs)/index.tsx', 'w') as f:
    f.write(code)
