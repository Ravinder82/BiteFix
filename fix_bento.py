import re

with open('src/app/(tabs)/index.tsx', 'r') as f:
    code = f.read()

bento_jsx = """        {/* BENTO GRID CONTAINER */}
        <View style={{ gap: 16, marginBottom: 24 }}>

          {/* ── BENTO CARD 1: BiteFix Basket Scoreboard (Hero Card) ── */}
          <View
            style={{
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.35 : 0.06,
              shadowRadius: 16,
              elevation: 4,
              position: 'relative',
            }}
          >
            <Image 
              source={basketImpastoBg} 
              style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: isDark ? 0.25 : 0.35 }} 
              contentFit="cover" 
            />
            <LinearGradient
              colors={isDark ? ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.95)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <View style={{ padding: 20, zIndex: 10 }}>
              {/* Header Row */}
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginBottom: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
                    BiteFix Basket Scoreboard
                  </Text>
                </View>
              </View>

              {/* Center Info Panel (Mascot Ring) */}
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '100%' }}>
                <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Svg width={220} height={220} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                    <Defs>
                      <RadialGradient id="ringGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                        <Stop offset="0%" stopColor={scoreColor} stopOpacity="0.4" />
                        <Stop offset="70%" stopColor={scoreColor} stopOpacity="0.1" />
                        <Stop offset="100%" stopColor={scoreColor} stopOpacity="0" />
                      </RadialGradient>
                      <SvgLinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={scoreColor} />
                        <Stop offset="100%" stopColor={lighterScoreColor} />
                      </SvgLinearGradient>
                    </Defs>
                    <Circle cx="60" cy="60" r="54" fill="url(#ringGlow)" />
                    <Circle cx="60" cy="60" r="48" fill="none" stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'} strokeWidth="12" />
                    <Circle cx="60" cy="60" r="56" fill="none" stroke={scoreColor} strokeWidth="1.5" opacity="0.25" />
                    <Circle cx="60" cy="60" r="40" fill="none" stroke={scoreColor} strokeWidth="1.5" opacity="0.15" />
                    <Circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      stroke="url(#progressGrad)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="301.6"
                      strokeDashoffset={
                        basketItemCount === 0
                          ? 301.6
                          : 301.6 * (1 - Math.max(5, avgBiteFixScore) / 100)
                      }
                      transform="rotate(-90 60 60)"
                    />
                  </Svg>

                  <View style={{ marginTop: 24 }}>
                    <Mascot state={mascotState} size={115} />
                  </View>

                  <View style={{
                    position: 'absolute',
                    bottom: -8,
                    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    borderWidth: 1.5,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: scoreColor }} />
                    <Text style={{ color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 }}>
                      {basketItemCount === 0 ? 'BASKET EMPTY' : `BASKET SCORE: ${avgBiteFixScore}`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Mascot Thought Callout */}
              <View style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 16,
                alignItems: 'center',
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10.5, fontWeight: '700', textAlign: 'center', lineHeight: 14 }}>
                  {getMascotThought()}
                </Text>
              </View>

              {/* Basket Processing Composition Section (NOVA Distribution Street Lights) */}
              <View style={{ paddingTop: 14, borderTopWidth: 1.5, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Basket NOVA Profile (Processing Levels)
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                  {[
                    { level: 1, color: '#10B981', label: 'Whole' },
                    { level: 2, color: '#14B8A6', label: 'Culinary' },
                    { level: 3, color: '#F59E0B', label: 'Processed' },
                    { level: 4, color: '#EF4444', label: 'Ultra-Proc' },
                  ].map(({ level, color }) => {
                    const count = collection.filter(item => item.novaClass === level).length;
                    const isLightActive = count > 0;
                    return (
                      <View key={level} style={{ flex: 1 }}>
                        <View
                          style={{
                            paddingVertical: 8,
                            borderRadius: 14,
                            backgroundColor: isLightActive
                              ? (isDark ? `${color}18` : `${color}10`)
                              : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                            borderWidth: 1.5,
                            borderColor: isLightActive ? color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Text style={{ color: isLightActive ? colors.text : colors.textMuted, fontSize: 9, fontWeight: '900' }}>
                            NOVA {level}
                          </Text>
                          <View style={{ backgroundColor: isLightActive ? color : 'transparent', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6 }}>
                            <Text style={{ color: isLightActive ? '#FFFFFF' : colors.textMuted, fontSize: 9.5, fontWeight: '900' }}>
                              {count}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Basket Nutri-Score Distribution Section */}
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1.5, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Basket Nutri-Score
                  </Text>
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: colors.text, fontSize: 9.5, fontWeight: '900' }}>
                      AVG: {avgNutriScore ? `GRADE ${avgNutriScore.toUpperCase()}` : '--'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', height: 38, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.03)', borderRadius: 19, paddingHorizontal: 4 }}>
                  {[
                    { key: 'a', letter: 'A', color: '#038141' },
                    { key: 'b', letter: 'B', color: '#85BB2F' },
                    { key: 'c', letter: 'C', color: '#FECB02' },
                    { key: 'd', letter: 'D', color: '#EE8100' },
                    { key: 'e', letter: 'E', color: '#E63E11' },
                  ].map((g, index, arr) => {
                    const isActive = avgNutriScore ? avgNutriScore.toLowerCase() === g.key : false;
                    const isFirst = index === 0;
                    const isLast = index === arr.length - 1;
                    return (
                      <View
                        key={g.key}
                        style={{
                          flex: 1,
                          height: isActive ? 28 : 24,
                          backgroundColor: isActive ? g.color : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                          borderColor: isActive ? '#FFFFFF' : (isDark ? g.color + '60' : g.color + '35'),
                          borderWidth: isActive ? 1.5 : 1,
                          borderTopLeftRadius: isFirst ? 14 : (isActive ? 8 : 6),
                          borderBottomLeftRadius: isFirst ? 14 : (isActive ? 8 : 6),
                          borderTopRightRadius: isLast ? 14 : (isActive ? 8 : 6),
                          borderBottomRightRadius: isLast ? 14 : (isActive ? 8 : 6),
                          marginHorizontal: 2,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: isActive ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'), fontSize: isActive ? 13 : 10, fontWeight: '900' }}>
                          {g.letter}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* ── BENTO CARD 2: Gut Shield Pro Telemetry ── */}
          <View
            style={{
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.35 : 0.06,
              shadowRadius: 14,
              elevation: 4,
              position: 'relative',
            }}
          >
            <Image 
              source={gutShieldBg} 
              style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: isDark ? 0.25 : 0.35 }} 
              contentFit="cover" 
            />
            <LinearGradient
              colors={isDark ? ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.95)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            
            <View style={{ padding: 20, zIndex: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color={avgGutHealthScore >= 75 ? '#A855F7' : avgGutHealthScore >= 50 ? '#D946EF' : '#F43F5E'} />
                  <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Basket Gut Health
                  </Text>
                </View>
                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                  <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '900' }}>
                    SCORE: {avgGutHealthScore}%
                  </Text>
                </View>
              </View>

              {/* Progress Bar Track */}
              <View
                style={{
                  height: 24,
                  width: '100%',
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${Math.max(10, avgGutHealthScore)}%`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <LinearGradient
                    colors={
                      avgGutHealthScore >= 75
                        ? ['rgba(168, 85, 247, 0.4)', '#A855F7']
                        : avgGutHealthScore >= 50
                          ? ['rgba(217, 70, 239, 0.4)', '#D946EF']
                          : ['rgba(244, 63, 94, 0.4)', '#F43F5E']
                    }
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                  />
                </View>
              </View>

              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <Text style={{ color: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.7)', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' }}>
                  {avgGutHealthScore >= 75
                    ? '🟢 EXCELLENT MICROBIOME STANDING'
                    : avgGutHealthScore >= 50
                      ? '🟡 MODERATE GUT INTEGRITY'
                      : '🔴 CRITICAL GUT DISRUPTORS DETECTED'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── BENTO ROW 3: Quad Metrics 2-Column Side-by-Side ── */}
          <View style={{ flexDirection: 'row', gap: 12 }}>

            {/* BENTO TILE 3: Total Sugar Audit */}
            <View
              style={{
                flex: 1,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.05,
                shadowRadius: 10,
                elevation: 3,
                position: 'relative',
              }}
            >
              <Image 
                source={sugarAuditBg} 
                style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: isDark ? 0.25 : 0.35 }} 
                contentFit="cover" 
              />
              <LinearGradient
                colors={isDark ? ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.95)']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              <View style={{ padding: 16, justifyContent: 'space-between', minHeight: 125, zIndex: 10 }}>
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Sugar
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '600', marginTop: 2 }}>
                    1 tsp = 4.2g (WHO)
                  </Text>
                </View>
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>
                    {totalSugarTeaspoons.toFixed(1)} <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>tsp</Text>
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700', marginTop: 1 }}>
                    per serving avg
                  </Text>
                </View>
              </View>
            </View>

            {/* BENTO TILE 4: Eco-Score Climate Telemetry */}
            <View
              style={{
                flex: 1,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.05,
                shadowRadius: 10,
                elevation: 3,
                position: 'relative',
              }}
            >
              <Image 
                source={ecoClimateBg} 
                style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: isDark ? 0.25 : 0.35 }} 
                contentFit="cover" 
              />
              <LinearGradient
                colors={isDark ? ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.95)']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              <View style={{ padding: 16, justifyContent: 'space-between', minHeight: 125, zIndex: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                </View>
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                    {totalCarbonFootprintGrams >= 1000 ? `${totalCarbonFootprintKg} kg` : `${totalCarbonFootprintGrams.toFixed(0)} g`}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '600', marginTop: 1 }}>
                    {basketItemCount > 0 ? `🚗 ~${milesDrivenEquivalent} mi driven` : '0 mi driven'}
                  </Text>
                </View>
              </View>
            </View>

          </View>

          {/* ── BENTO CARD 5: Active Calorie Burn Down (Full Width) ── */}
          <View
            style={{
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.35 : 0.06,
              shadowRadius: 14,
              elevation: 4,
              position: 'relative',
            }}
          >
            <Image 
              source={calorieBurnBg} 
              style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: isDark ? 0.25 : 0.35 }} 
              contentFit="cover" 
            />
            <LinearGradient
              colors={isDark ? ['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.95)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.95)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <View style={{ padding: 20, zIndex: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Flame size={15} color="#F97316" />
                  <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Active Calorie Burn Down
                  </Text>
                </View>
                <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
                  <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '900' }}>
                    {totalBasketCalories} kcal
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                {/* Card 1: Jogging */}
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(249, 115, 22, 0.25)',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: '#F97316', padding: 5, borderRadius: 8 }}>
                      <Activity size={12} color="#FFFFFF" />
                    </View>
                    <Text style={{ color: '#F97316', fontSize: 8.5, fontWeight: '900' }}>HIGH</Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '700' }}>Jogging</Text>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 2 }}>
                      {formatBurnTime(burnDownActivities?.jogMins ?? 0)}
                    </Text>
                  </View>
                </View>

                {/* Card 2: Cycling */}
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(6, 182, 212, 0.25)',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: '#06B6D4', padding: 5, borderRadius: 8 }}>
                      <Bike size={12} color="#FFFFFF" />
                    </View>
                    <Text style={{ color: '#06B6D4', fontSize: 8.5, fontWeight: '900' }}>MOD</Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '700' }}>Cycling</Text>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 2 }}>
                      {formatBurnTime(burnDownActivities?.cycleMins ?? 0)}
                    </Text>
                  </View>
                </View>

                {/* Card 3: Swimming */}
                <View
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ backgroundColor: '#3B82F6', padding: 5, borderRadius: 8 }}>
                      <Waves size={12} color="#FFFFFF" />
                    </View>
                    <Text style={{ color: '#3B82F6', fontSize: 8.5, fontWeight: '900' }}>MOD</Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 9.5, fontWeight: '700' }}>Swimming</Text>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 2 }}>
                      {formatBurnTime(burnDownActivities?.swimMins ?? 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

        </View>"""

# Find the start and end indices using explicit string matching
# Start marker:
start_marker = "        {/* Card A: Daily Clean Score Card */}"
end_marker = "        {/* Your Basket Section */}"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_code = code[:start_idx] + bento_jsx + "\n\n" + code[end_idx:]
    with open('src/app/(tabs)/index.tsx', 'w') as f:
        f.write(new_code)
    print("SUCCESS: Replaced old layout with new Bento Grid")
else:
    print(f"FAILED: start={start_idx}, end={end_idx}")

