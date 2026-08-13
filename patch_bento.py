import re

with open('src/app/(tabs)/index.tsx', 'r') as f:
    code = f.read()

# 1. Remove ImageBackground openings and replace with LinearGradient directly
code = re.sub(
    r'<ImageBackground\s*source=\{basketImpastoBg\}[^>]*>\s*<LinearGradient\s*colors=\{([^}]+)\}\s*style=\{\{\s*padding:\s*20\s*\}\}\s*>',
    r'<LinearGradient colors={\1} style={{ padding: 20 }}>',
    code
)

code = re.sub(
    r'<ImageBackground\s*source=\{gutShieldBg\}[^>]*>\s*<LinearGradient\s*colors=\{([^}]+)\}\s*style=\{\{\s*padding:\s*20\s*\}\}\s*>',
    r'<LinearGradient colors={\1} style={{ padding: 20 }}>',
    code
)

code = re.sub(
    r'<ImageBackground\s*source=\{sugarAuditBg\}[^>]*>\s*<LinearGradient\s*colors=\{([^}]+)\}\s*style=\{([^}]+)\}\s*>',
    r'<LinearGradient colors={\1} style={\2}>',
    code
)

code = re.sub(
    r'<ImageBackground\s*source=\{ecoClimateBg\}[^>]*>\s*<LinearGradient\s*colors=\{([^}]+)\}\s*style=\{([^}]+)\}\s*>',
    r'<LinearGradient colors={\1} style={\2}>',
    code
)

code = re.sub(
    r'<ImageBackground\s*source=\{calorieBurnBg\}[^>]*>\s*<LinearGradient\s*colors=\{([^}]+)\}\s*style=\{\{\s*padding:\s*20\s*\}\}\s*>',
    r'<LinearGradient colors={\1} style={{ padding: 20 }}>',
    code
)

# 2. Add the small images into the headers

# Basket
code = code.replace(
    '''                {/* Header Row */}
                <View style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginBottom: 4 }}>''',
    '''                {/* Header Row */}
                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginBottom: 4 }}>'''
)
code = code.replace(
    '''                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
                      BiteFix Basket Scoreboard
                    </Text>
                  </View>
                </View>''',
    '''                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
                      BiteFix Basket Scoreboard
                    </Text>
                  </View>
                  <Image source={basketImpastoBg} style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} contentFit="cover" />
                </View>'''
)

# Gut Shield
code = code.replace(
    '''                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '900' }}>
                      SCORE: {avgGutHealthScore}%
                    </Text>
                  </View>
                </View>''',
    '''                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '900' }}>
                        SCORE: {avgGutHealthScore}%
                      </Text>
                    </View>
                    <Image source={gutShieldBg} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} contentFit="cover" />
                  </View>
                </View>'''
)

# Sugar Audit
code = code.replace(
    '''                  <View>
                    <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Total Sugar
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '600', marginTop: 2 }}>
                      1 tsp = 4.2g (WHO limit)
                    </Text>
                  </View>''',
    '''                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Total Sugar
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '600', marginTop: 2 }}>
                        1 tsp = 4.2g (WHO)
                      </Text>
                    </View>
                    <Image source={sugarAuditBg} style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} contentFit="cover" />
                  </View>'''
)

# Climate
code = code.replace(
    '''                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Leaf size={13} color="#10B981" />
                      <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Climate
                      </Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      <Text style={{ color: '#10B981', fontSize: 8.5, fontWeight: '900' }}>
                        {avgEcoScore ? `${avgEcoScore.toUpperCase()}` : 'N/A'}
                      </Text>
                    </View>
                  </View>''',
    '''                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Leaf size={13} color="#10B981" />
                      <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Climate
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <Text style={{ color: '#10B981', fontSize: 8.5, fontWeight: '900' }}>
                          {avgEcoScore ? `${avgEcoScore.toUpperCase()}` : 'N/A'}
                        </Text>
                      </View>
                      <Image source={ecoClimateBg} style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} contentFit="cover" />
                    </View>
                  </View>'''
)

# Calorie Burn
code = code.replace(
    '''                  <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
                    <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '900' }}>
                      {totalBasketCalories} kcal
                    </Text>
                  </View>
                </View>''',
    '''                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
                      <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '900' }}>
                        {totalBasketCalories} kcal
                      </Text>
                    </View>
                    <Image source={calorieBurnBg} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} contentFit="cover" />
                  </View>
                </View>'''
)

# 3. Clean up the closing tags
code = code.replace('</LinearGradient>\n            </ImageBackground>', '</LinearGradient>')
code = code.replace('</LinearGradient>\n              </ImageBackground>', '</LinearGradient>')

with open('src/app/(tabs)/index.tsx', 'w') as f:
    f.write(code)
