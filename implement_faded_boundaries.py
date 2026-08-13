import re

with open('src/app/(tabs)/index.tsx', 'r') as f:
    code = f.read()

# Helper function to inject faded background pattern
def inject_faded_bg(match):
    image_var = match.group(1)
    return f'''          <View
            style={{
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: {{ width: 0, height: 8 }},
              shadowOpacity: isDark ? 0.35 : 0.06,
              shadowRadius: 16,
              elevation: 4,
              position: 'relative',
            }}
          >
            <Image 
              source={{{image_var}}} 
              style={{{{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: isDark ? 0.5 : 0.7 }}}} 
              contentFit="cover" 
            />
            <LinearGradient
              colors={{isDark ? ['transparent', 'rgba(15, 23, 42, 0.85)', '#0F172A'] : ['transparent', 'rgba(248, 250, 252, 0.85)', '#F8FAFC']}}
              start={{{{ x: 1, y: 0 }}}}
              end={{{{ x: 0.1, y: 0.9 }}}}
              style={{{{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}}}
            />
            <View style={{{{ padding: 20, zIndex: 10 }}}}>'''

# BENTO 1
code = re.sub(
    r'<\!\-\- ── BENTO CARD 1:[^\n]+\n\s+<View\s+style=\{\{[\s\S]+?elevation:\ 4,\n\s+\}\}\n\s+>\n\s+<LinearGradient[^>]+style=\{\{\s*padding:\s*20\s*\}\}>',
    lambda m: '<!-- ── BENTO CARD 1: BiteFix Basket Scoreboard (Hero Card) ── -->' + inject_faded_bg(re.match(r'', '') or type('obj', (object,), {'group': lambda self, x: 'basketImpastoBg'})()),
    code
)

# BENTO 2
code = re.sub(
    r'<\!\-\- ── BENTO CARD 2:[^\n]+\n\s+<View\s+style=\{\{[\s\S]+?elevation:\ 4,\n\s+\}\}\n\s+>\n\s+<LinearGradient[^>]+style=\{\{\s*padding:\s*20\s*\}\}>',
    lambda m: '<!-- ── BENTO CARD 2: Gut Shield Pro Telemetry ── -->' + inject_faded_bg(re.match(r'', '') or type('obj', (object,), {'group': lambda self, x: 'gutShieldBg'})()),
    code
)

# BENTO 5
code = re.sub(
    r'<\!\-\- ── BENTO CARD 5:[^\n]+\n\s+<View\s+style=\{\{[\s\S]+?elevation:\ 4,\n\s+\}\}\n\s+>\n\s+<LinearGradient[^>]+style=\{\{\s*padding:\s*20\s*\}\}>',
    lambda m: '<!-- ── BENTO CARD 5: Active Calorie Burn Down (Full Width) ── -->' + inject_faded_bg(re.match(r'', '') or type('obj', (object,), {'group': lambda self, x: 'calorieBurnBg'})()),
    code
)

# Small Cards (Tile 3 & 4)
def inject_faded_bg_small(image_var):
    return f'''            <View
              style={{
                flex: 1,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: {{ width: 0, height: 4 }},
                shadowOpacity: isDark ? 0.3 : 0.05,
                shadowRadius: 10,
                elevation: 3,
                position: 'relative',
              }}
            >
              <Image 
                source={{{image_var}}} 
                style={{{{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: isDark ? 0.5 : 0.7 }}}} 
                contentFit="cover" 
              />
              <LinearGradient
                colors={{isDark ? ['transparent', 'rgba(15, 23, 42, 0.85)', '#0F172A'] : ['transparent', 'rgba(248, 250, 252, 0.85)', '#F8FAFC']}}
                start={{{{ x: 1, y: 0 }}}}
                end={{{{ x: 0.1, y: 0.9 }}}}
                style={{{{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}}}
              />
              <View style={{{{ padding: 16, justifyContent: 'space-between', minHeight: 125, zIndex: 10 }}}}>'''

code = re.sub(
    r'<\!\-\- BENTO TILE 3:[^\n]+\n\s+<View\s+style=\{\{[\s\S]+?elevation:\ 3,\n\s+\}\}\n\s+>\n\n\s+<LinearGradient[^>]+style=\{\{ padding: 16, justifyContent: \'space-between\', minHeight: 125 \}\}\n\s+>',
    lambda m: '<!-- BENTO TILE 3: Total Sugar Audit -->' + inject_faded_bg_small('sugarAuditBg'),
    code
)

code = re.sub(
    r'<\!\-\- BENTO TILE 4:[^\n]+\n\s+<View\s+style=\{\{[\s\S]+?elevation:\ 3,\n\s+\}\}\n\s+>\n\n\s+<LinearGradient[^>]+style=\{\{ padding: 16, justifyContent: \'space-between\', minHeight: 125 \}\}\n\s+>',
    lambda m: '<!-- BENTO TILE 4: Eco-Score Climate Telemetry -->' + inject_faded_bg_small('ecoClimateBg'),
    code
)

# Remove the mini images
code = re.sub(r'<Image source=\{[a-zA-Z]+\}\s*style=\{\{ width: (?:44|36|32).*?\}\}\s*contentFit="cover"\s*/>', '', code)
# Fix the outer flex direction gaps that were added for the mini images
code = code.replace(
    '''                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '900' }}>
                        SCORE: {avgGutHealthScore}%
                      </Text>
                    </View>
                    
                  </View>''',
    '''                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '900' }}>
                      SCORE: {avgGutHealthScore}%
                    </Text>
                  </View>'''
)

code = code.replace(
    '''                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <Text style={{ color: '#10B981', fontSize: 8.5, fontWeight: '900' }}>
                          {avgEcoScore ? `${avgEcoScore.toUpperCase()}` : 'N/A'}
                        </Text>
                      </View>
                      
                    </View>''',
    '''                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      <Text style={{ color: '#10B981', fontSize: 8.5, fontWeight: '900' }}>
                        {avgEcoScore ? `${avgEcoScore.toUpperCase()}` : 'N/A'}
                      </Text>
                    </View>'''
)

code = code.replace(
    '''                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
                      <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '900' }}>
                        {totalBasketCalories} kcal
                      </Text>
                    </View>
                    
                  </View>''',
    '''                  <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
                    <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '900' }}>
                      {totalBasketCalories} kcal
                    </Text>
                  </View>'''
)


# Revert closing tags from </LinearGradient> to </View>
# Since there are exactly 5 of them at the end of the cards
code = code.replace('              </LinearGradient>\n          </View>\n\n          {/* ── BENTO CARD 2', '              </View>\n          </View>\n\n          {/* ── BENTO CARD 2')
code = code.replace('              </LinearGradient>\n          </View>\n\n          {/* ── BENTO ROW 3', '              </View>\n          </View>\n\n          {/* ── BENTO ROW 3')
code = code.replace('                </LinearGradient>\n            </View>\n\n            {/* BENTO TILE 4', '                </View>\n            </View>\n\n            {/* BENTO TILE 4')
code = code.replace('                </LinearGradient>\n            </View>\n\n          </View>\n\n          {/* ── BENTO CARD 5', '                </View>\n            </View>\n\n          </View>\n\n          {/* ── BENTO CARD 5')
code = code.replace('              </LinearGradient>\n          </View>\n\n        </View>\n\n\n\n\n        {/* Your Basket Section', '              </View>\n          </View>\n\n        </View>\n\n\n\n\n        {/* Your Basket Section')

with open('src/app/(tabs)/index.tsx', 'w') as f:
    f.write(code)

