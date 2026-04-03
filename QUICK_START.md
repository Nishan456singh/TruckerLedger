# ⚡ QUICK START - Do This First

**Get your new architecture running in 5 minutes**

---

## 🎯 The 3-Step Setup

### STEP 1: Enable ThemeProvider (2 minutes)

Edit: `app/_layout.tsx`

**Add this import at the top:**
```typescript
import { ThemeProvider } from "@/lib/themeContext";
```

**Wrap your Stack with ThemeProvider:**
```typescript
export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
```

✅ **That's it!** Theme system now works everywhere.

---

### STEP 2: Test It Works (2 minutes)

Go to a screen that has a button or text.

Add this temporary code to test:
```tsx
import { useTheme } from "@/lib/themeContext";

export default function TestScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity onPress={toggleTheme}>
        <Text style={{ color: colors.textPrimary, fontSize: 18 }}>
          Tap me: Currently {isDark ? 'DARK' : 'LIGHT'} mode
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

✅ **Tap the text** - theme should toggle between light and dark!

Remove this test code when done.

---

### STEP 3: Refactor ONE Screen (1 minute setup)

Pick the SIMPLEST screen to start.

Example: `app/monthly-summary.tsx`

**Current pattern:**
```tsx
export default function Screen() {
  return (
    <ScreenBackground>
      <SafeAreaView>
        {/* Manual hero section */}
        {/* Manual floating card */}
        {/* Content */}
      </SafeAreaView>
    </ScreenBackground>
  );
}
```

**New pattern:**
```tsx
import AppLayout from "@/components/AppLayout";
import Section from "@/components/Section";
import { ColorSystem, TypographyTable } from "@/constants/designSystem";
import { enterFadeDown } from "@/lib/animations";
import Animated from "react-native-reanimated";

export default function Screen() {
  return (
    <AppLayout
      title="Monthly Summary"
      gradientColors={[ColorSystem.primary, "#E8B107"]}
      onBack={() => router.back()}
    >
      <Animated.View entering={enterFadeDown.delay(100)}>
        <Section title="Summary" variant="card" shadow>
          <Text style={TypographyTable.body}>Your content here</Text>
        </Section>
      </Animated.View>
    </AppLayout>
  );
}
```

That's the pattern for every screen!

---

## 📖 What to Read Next

1. **Read: `PRODUCTION_GUIDE.md`** (5-10 min)
   - Understand the big picture
   - See what each component does
   - Review best practices

2. **Read: `EXAMPLES.md`** (10-15 min)
   - See 3 complete refactored screens
   - Copy-paste code patterns
   - Understand styling approach

3. **Follow: `IMPLEMENTATION_CHECKLIST.md`**
   - Step-by-step implementation
   - Tier-based screen refactoring
   - QA checklist

---

## 🎨 Key Concepts (Quick Ref)

### AppLayout - Screen Wrapper
```tsx
<AppLayout
  title="Screen Title"           // Required
  value={heroValue}              // Optional big number
  valueSuffix="unit"             // Suffix for value (",Today", " Spent")
  gradientColors={[...]}         // Hero gradient colors
  onBack={() => router.back()}   // Back button handler
  headerVariant="default"        // "default" or "centered"
>
  {/* Your content goes here */}
</AppLayout>
```

### Section - Content Grouping
```tsx
<Section
  title="Group Title"            // Optional
  variant="card"                 // "default", "card", or "flat"
  shadow                         // Add shadow?
  gap={Spacing.lg}               // Gap between items
>
  <Content />
</Section>
```

### Design Tokens - Never Hardcode!
```tsx
// ❌ WRONG
<Text style={{ color: '#111111', fontSize: 16, marginLeft: 12 }}>
  Text
</Text>

// ✅ RIGHT
import { ColorSystem, TypographyTable, SpacingScale } from "@/constants/designSystem";

<Text style={{
  color: ColorSystem.textPrimary,
  ...TypographyTable.body,
  marginLeft: SpacingScale.md
}}>
  Text
</Text>
```

### Animations - Add Life!
```tsx
import { enterFadeDown, listItemAnimation } from "@/lib/animations";
import Animated from "react-native-reanimated";

// Hero section fades in
<Animated.View entering={enterFadeDown.delay(100)}>
  <Hero />
</Animated.View>

// List items stagger in
{items.map((item, i) => (
  <Animated.View key={item.id} entering={listItemAnimation(i)}>
    <ListItem item={item} />
  </Animated.View>
))}
```

### Theme - Automatic Light/Dark
```tsx
import { useTheme } from "@/lib/themeContext";

export default function Component() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>
        Colors automatically match {isDark ? 'dark' : 'light'} mode!
      </Text>
    </View>
  );
}
```

---

## 🚀 Next 30 Minutes

After setup, pick ONE screen and refactor it:

1. Open `EXAMPLES.md`
2. Find similar screen example
3. Copy the pattern
4. Update content
5. Replace hardcoded values with design tokens
6. Add animations
7. Test in light + dark mode

That one screen will be 60% less code but 10x better!

---

## 💡 Pro Tips

✅ **DO:**
- Use AppLayout for every screen
- Import design tokens (never hardcode)
- Wrap content in Sections
- Add animations to everything
- Test light/dark mode

❌ **DON'T:**
- Hardcode colors (#123456)
- Hardcode spacing (16, 12, 8)
- Create custom shadows
- Skip animations
- Ignore safe areas

---

## 🆘 Troubleshooting

**Q: Theme not toggling?**
- Did you wrap app with `<ThemeProvider>`?
- Is `useTheme()` being called inside ThemeProvider?

**Q: Dark colors look wrong?**
- Check the DarkColors in `lib/themeContext.tsx`
- Colors are adjusted for dark backgrounds
- Remove opacity/lightness if too pale

**Q: Animations stuttering?**
- Limit list animations to 10-15 items
- Use `scrollEventThrottle={16}` on ScrollView
- Memoize list items: `React.memo(ListItem)`

**Q: Design tokens not applying?**
- Restart dev server after import
- Make sure you're importing from `/constants/designSystem`
- Check TypeScript for import errors

---

## 📞 Reference Files

| File | Contains |
|---|---|
| `PRODUCTION_GUIDE.md` | How to use everything |
| `EXAMPLES.md` | 3 refactored screens |
| `IMPLEMENTATION_CHECKLIST.md` | Phase-by-phase plan |
| `constants/designSystem.ts` | All design tokens |
| `lib/animations.ts` | Animation reference |
| `lib/themeContext.tsx` | Theme documentation |

---

## ✅ Success!

After 30 minutes:
- ✅ ThemeProvider enabled
- ✅ Light/dark mode working
- ✅ 1 screen refactored
- ✅ Animations smooth
- ✅ Design tokens applied

**You're now ready to roll out to all screens!** 🎉

---

## 🎬 Action Items

- [ ] Add ThemeProvider to `app/_layout.tsx`
- [ ] Test light/dark mode toggle
- [ ] Read `PRODUCTION_GUIDE.md`
- [ ] Copy example from `EXAMPLES.md`
- [ ] Refactor first screen
- [ ] Test on device
- [ ] Follow `IMPLEMENTATION_CHECKLIST.md` for rest

**Start now! Your new architecture awaits!** 🚀
