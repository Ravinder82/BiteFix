const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/onboarding/index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add MagicalBackground import
content = content.replace(
  "import { OrbMascot } from '../../components/features/OrbMascot';",
  "import { OrbMascot } from '../../components/features/OrbMascot';\nimport { MagicalBackground } from '../../components/features/MagicalBackground';"
);

// 2. Remove GoalCard and update ProfileCard
const goalCardRegex = /\/\/ ─────────────────────────────────────────────────────────\n\/\/ Slide 2: Personalized Goal Card[\s\S]*?\/\/ ─────────────────────────────────────────────────────────\n\/\/ Slide 3: Combined Cravings & Pace Profile Card\n\/\/ ─────────────────────────────────────────────────────────\ntype SweetToothOption/m;

const profileCardReplacement = `// ─────────────────────────────────────────────────────────
// Slide 2: Combined Goal, Cravings & Pace Profile Card
// ─────────────────────────────────────────────────────────
type GoalOption = 'energy' | 'weight' | 'medical' | 'mental' | 'none';
type SweetToothOption = 'high' | 'moderate' | 'low' | 'none';
type PaceOption = 'cold_turkey' | 'gradual' | 'tracking' | 'none';

function ProfileCard({
  cardW,
  C,
  userGoal,
  setUserGoal,
  sweetTooth,
  setSweetTooth,
  journeyPace,
  setJourneyPace,
}: {
  cardW: number;
  C: any;
  userGoal: GoalOption;
  setUserGoal: (val: GoalOption) => void;
  sweetTooth: SweetToothOption;
  setSweetTooth: (val: SweetToothOption) => void;
  journeyPace: PaceOption;
  setJourneyPace: (val: PaceOption) => void;
}) {
  const goals: { label: string; value: GoalOption }[] = [
    { label: "Energy", value: 'energy' },
    { label: "Weight", value: 'weight' },
    { label: "Medical", value: 'medical' },
  ];

  const cravings: { label: string; value: SweetToothOption }[] = [
    { label: "High", value: 'high' },
    { label: "Medium", value: 'moderate' },
    { label: "Low", value: 'low' },
  ];

  const paces: { label: string; value: PaceOption }[] = [
    { label: "Cold Turkey", value: 'cold_turkey' },
    { label: "Gradual", value: 'gradual' },
    { label: "Just Track", value: 'tracking' },
  ];

  const renderRow = (title: string, options: any[], selectedValue: any, onSelect: any) => (
    <View style={{ width: '100%' }}>
      <Text style={{ color: C.textSub, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {options.map((opt) => {
          const isSel = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.value);
              }}
              style={{
                flex: 1,
                backgroundColor: isSel ? C.amberLight : C.cardInner,
                borderColor: isSel ? C.amber : C.cardBorder,
                borderWidth: 1.5,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: isSel ? C.amber : C.text, fontSize: 11, fontWeight: '700' }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{
      width: cardW,
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      gap: 12,
    }}>
      {renderRow("Primary Goal", goals, userGoal, setUserGoal)}
      {renderRow("Sugar Cravings", cravings, sweetTooth, setSweetTooth)}
      {renderRow("Target Pace", paces, journeyPace, setJourneyPace)}
    </View>
  );
}
`;

// Replace GoalCard and ProfileCard definition
const endOfProfileCardRegex = /function ProfileCard[\s\S]*?    <\/View>\n  \);\n}\n/m;
content = content.replace(goalCardRegex, "// Slide 2\ntype SweetToothOption");
content = content.replace(endOfProfileCardRegex, "");
content = content.replace("// Slide 2\ntype SweetToothOption", profileCardReplacement);


// 3. Update SLIDES array
const slidesRegex = /const SLIDES: SlideData\[\] = \([\s\S]*?\];/;
// We'll replace the array definition
content = content.replace(/const SLIDES: SlideData\[\] = \[[\s\S]*?\];/, `const SLIDES: SlideData[] = [
  {
    step: 1,
    title: "Welcome! What's your name?",
    highlight: "What's your name?",
    subtitle: "Let's personalize your path to a sugar-free lifestyle.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 2,
    title: "Your Sugar Profile",
    highlight: "Sugar Profile",
    subtitle: "Select your goal, cravings, and target pace.",
    buttonLabel: 'Continue',
    isLast: false,
    mascotState: 'idle',
  },
  {
    step: 3,
    title: 'Real Time Sugar Scanner',
    highlight: 'Sugar Scanner',
    subtitle: 'Scan product barcodes and see abstract grams instantly converted into teaspoons.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 4,
    title: 'Log your Blood Sugar.',
    highlight: 'Blood Sugar.',
    subtitle: 'Log fasting and post-meal readings to manage clinical blood sugar trends.',
    buttonLabel: 'Next',
    isLast: false,
    mascotState: 'happy',
  },
  {
    step: 5,
    title: "Your Setup is Complete",
    highlight: "Setup is Complete",
    subtitle: "We're ready to start this life-changing journey together.",
    buttonLabel: 'Get Started',
    isLast: true,
    mascotState: 'happy',
  },
];`);


// 4. Update Validation Logic (isNextDisabled and handleNext)
content = content.replace(/if \(currentSlide === 1\) {[\s\S]*?if \(currentSlide === 2\) {/m, `if (currentSlide === 1) {
      if (userGoal === 'none' || sweetTooth === 'none' || journeyPace === 'none') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }
    // Camera permission request during feature showcase
    if (currentSlide === 2) {`);
content = content.replace(/if \(currentSlide === 3\) {\n      try {\n        await Camera.requestCameraPermissionsAsync\(\);\n      } catch \(_\) {}\n    }/m, "");

content = content.replace(/const isNextDisabled = \(\) => {[\s\S]*?return false;\n  };/, `const isNextDisabled = () => {
    if (currentSlide === 0 && !userName.trim()) return true;
    if (currentSlide === 1 && (userGoal === 'none' || sweetTooth === 'none' || journeyPace === 'none')) return true;
    return false;
  };`);


// 5. Update render cards
content = content.replace(/<Animated\.View style=\{\[\{ alignSelf: 'center', width: cardW \}, cardAnimStyle\]\}>[\s\S]*?<\/Animated\.View>/m, `<Animated.View style={[{ alignSelf: 'center', width: cardW }, cardAnimStyle]}>
              {currentCardIndex === 0 && (
                <NameCard
                  cardW={cardW}
                  C={C}
                  value={userName}
                  onChange={setUserName}
                />
              )}
              {currentCardIndex === 1 && (
                <ProfileCard
                  cardW={cardW}
                  C={C}
                  userGoal={userGoal}
                  setUserGoal={setUserGoal}
                  sweetTooth={sweetTooth}
                  setSweetTooth={setSweetTooth}
                  journeyPace={journeyPace}
                  setJourneyPace={setJourneyPace}
                />
              )}
              {currentCardIndex === 2 && <ScannerTeaspoonCard cardW={cardW} C={C} />}
              {currentCardIndex === 3 && <ProgressCard cardW={cardW} C={C} />}
              {currentCardIndex === 4 && (
                <SetupCompleteCard
                  cardW={cardW}
                  C={C}
                  userName={userName}
                  userGoal={userGoal}
                />
              )}
            </Animated.View>`);


// 6. Add MagicalBackground behind Mascot
content = content.replace(/<View style=\{\{ alignItems: 'center', justifyContent: 'center' \}\}>\n              <MascotShadow/m, `<View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MagicalBackground />
              <MascotShadow`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Refactoring complete.");
