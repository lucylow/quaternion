# Production Value Guide

Complete guide to making Quaternion feel polished, professional, and judge-ready.

## Quick Start

1. **Review the Checklist**: `PRODUCTION_VALUE_CHECKLIST.md`
2. **Run Production Build**: `npm run build`
3. **Test Locally**: `npm run preview`
4. **Generate Build Report**: Fill in `BUILD_REPORT_TEMPLATE.md`
5. **Submit**: Upload to Itch.io with all assets

## Files Created

### Core Documentation
- `PRODUCTION_VALUE_CHECKLIST.md` - Complete QA checklist
- `BUILD_REPORT_TEMPLATE.md` - Metrics template for judges
- `PRODUCTION_VALUE_GUIDE.md` - This file

### Build Configuration
- `vite.config.production.ts` - Optimized production build config

### Subtitles
- `public/subtitles/demo.vtt` - WebVTT subtitle file
- `public/subtitles/demo.srt` - SRT subtitle file

### Code Components
- `src/utils/telemetry.ts` - Performance metrics collection
- `src/utils/errorHandler.ts` - Error handling and crash reporting
- `src/components/ui/Transition.tsx` - Smooth transitions
- `src/components/ui/LoadingBar.tsx` - Progress indicators
- `src/components/accessibility/AccessibilitySettings.tsx` - Accessibility options

## Build Optimization

### Production Build

```bash
# Standard production build
npm run build

# Build for Itch.io (includes ZIP creation)
npm run build:itch
```

### Build Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Total Size | < 80 MB | Code splitting, asset compression |
| Load Time | < 30s | Lazy loading, progressive loading |
| FPS | 30+ FPS | Phaser optimization, efficient rendering |
| Startup | < 15s | Code splitting, minimal initial load |

### Optimization Techniques Applied

1. **Code Splitting**
   - Phaser in separate chunk
   - React vendor libraries separated
   - UI components in separate chunk
   - API clients separated

2. **Asset Optimization**
   - Images: WebP format, compressed
   - Audio: OGG format, compressed
   - Fonts: WOFF2, subsetted

3. **Bundle Optimization**
   - Tree shaking (unused code removal)
   - Minification (esbuild)
   - Source maps disabled in production
   - Console.log removed in production

## Testing Matrix

### Browsers (Priority Order)

1. **Chrome** (Latest) - Primary target
2. **Firefox** (Latest) - Secondary target
3. **Edge** (Chromium) - Optional
4. **Safari** (Mac) - Optional

### Test Scenarios

- [ ] Fresh install (first-time load)
- [ ] Returning user (cached assets)
- [ ] Slow connection (5-10 Mbps throttled)
- [ ] Fast connection (50+ Mbps)
- [ ] Different screen resolutions (1280×720, 1920×1080)
- [ ] Extended play (10+ minutes for memory leaks)

### Edge Cases

- [ ] Zero resources
- [ ] Max resources
- [ ] No enemies visible
- [ ] All units destroyed
- [ ] Rapid state changes
- [ ] Multiple modal dialogs

## Telemetry & Metrics

### Automatic Collection

The telemetry system automatically collects:
- Startup time
- FPS samples
- Memory usage
- Load time
- Bundle size
- Crash count

### Usage

```typescript
import { telemetry } from '@/utils/telemetry';

// Metrics are collected automatically
// Get summary:
const metrics = telemetry.getMetrics();
console.log('Average FPS:', telemetry.getAverageFPS());

// Export for build report:
const json = telemetry.exportMetrics();
```

### Metrics to Report

Include these in your Build Report:
- Startup time: [XX]s
- Average FPS: [XX] FPS
- Peak memory: [XX] MB
- Total build size: [XX] MB
- Crash count: [XX] (should be 0)

## Error Handling

### Automatic Error Handling

The error handler automatically:
- Catches unhandled errors
- Records crashes in telemetry
- Shows user-friendly messages
- Prevents non-critical errors from disrupting gameplay

### Usage

```typescript
import { errorHandler } from '@/utils/errorHandler';

// Wrap async functions
const safeAsyncFn = errorHandler.wrapAsync(myAsyncFunction, {
  component: 'GameScene',
  action: 'loadAssets'
});

// Wrap sync functions
const safeSyncFn = errorHandler.wrapSync(mySyncFunction, {
  component: 'UI',
  action: 'render'
});
```

## Accessibility

### Features Implemented

1. **High Contrast Mode**
   - Toggle in accessibility settings
   - Increases contrast for readability

2. **Colorblind Support**
   - Protanopia (red-blind)
   - Deuteranopia (green-blind)
   - Tritanopia (blue-blind)
   - Icons supplement colors

3. **Subtitles**
   - Toggle on/off
   - Size adjustment (small/medium/large)
   - WebVTT/SRT support

4. **Keyboard Navigation**
   - Full keyboard support
   - Tab navigation
   - Keyboard shortcuts

5. **Screen Reader Support**
   - ARIA labels
   - Semantic HTML
   - Alt text for images

6. **Motion Reduction**
   - Respects prefers-reduced-motion
   - Optional camera shake toggle

### Usage

```tsx
import { AccessibilitySettingsPanel } from '@/components/accessibility/AccessibilitySettings';

// Add to settings menu
<AccessibilitySettingsPanel />
```

## UI Polish

### Transitions

Use the Transition component for smooth state changes:

```tsx
import { Transition } from '@/components/ui/Transition';

<Transition show={isVisible} duration={200} type="fade">
  <YourComponent />
</Transition>
```

### Loading States

Use LoadingBar for progress indication:

```tsx
import { LoadingBar } from '@/components/ui/LoadingBar';

<LoadingBar 
  progress={loadProgress} 
  message="Loading assets..."
  showPercentage
/>
```

## Subtitles

### WebVTT Format

Place subtitle files in `public/subtitles/`:
- `demo.vtt` - WebVTT format (web standard)
- `demo.srt` - SRT format (general distribution)

### Integration

```html
<video>
  <track kind="subtitles" src="/subtitles/demo.vtt" srclang="en" label="English" default />
</video>
```

## Submission Checklist

Before submitting, ensure:

- [ ] Build Report filled with actual metrics
- [ ] Trailer (60-90s) created and uploaded
- [ ] Vertical short created for social media
- [ ] Playable demo link working
- [ ] Step-by-step play instructions for judges
- [ ] 3 annotated screenshots
- [ ] "How AI was used" document
- [ ] Prompt logs (if applicable)
- [ ] Subtitle files included
- [ ] Known issues list (if any)
- [ ] Version number clearly marked

## Production Blurb Template

Use this for Devpost submission:

```
Production Quality: Quaternion's demo is a curated 8-minute playable loop 
designed for judges: compact, deterministic seed, and optimized for browser play. 
Build size: ~XX MB. Average demo FPS: ~YY on target test machine. All spoken 
content includes English subtitles; trailer and vertical short supplied. Audio 
and visuals were generated with AI tools and human-curated for consistency. 
Known issues (none critical): [link to file]. See full build report attached.
```

Replace:
- `XX` with actual build size in MB
- `YY` with average FPS
- `[link to file]` with link to known issues (or "none")

## Next Steps

1. **Run Production Build**: `npm run build`
2. **Test Locally**: `npm run preview`
3. **Fill Build Report**: Update `BUILD_REPORT_TEMPLATE.md` with actual metrics
4. **Create Trailer**: 60-90s showcasing best moments
5. **Test on Multiple Browsers**: Chrome, Firefox, Edge
6. **Collect Playtest Feedback**: 10-20 testers
7. **Final Polish**: Address any issues found
8. **Submit**: Upload to Itch.io with all assets

## Support

For issues or questions:
- Check `PRODUCTION_VALUE_CHECKLIST.md` for QA items
- Review `BUILD_REPORT_TEMPLATE.md` for metrics
- Test using `npm run preview` before deploying

