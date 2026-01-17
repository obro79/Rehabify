# Icon Generation Guide for Rehabify

This document outlines the process for generating custom exercise icons that match Rehabify's design system.

## Design System Reference

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Sage Green (Primary) | `#8B9F82` | Main icon color |
| Sage Light | `#A3B899`, `#9AAF91` | Gradients, highlights |
| Coral/Terracotta | `#D4A59A`, `#C4816D` | Accent, active states |
| Cream Background | `#F5F3EE` | App background |
| White | `#FFFFFF` | Card backgrounds, highlights |

### Visual Style

- **3D Pillowy**: Soft gradients with subtle shadows and inner highlights
- **Rounded**: No sharp edges, friendly curves
- **Minimalist**: Clean shapes, not overly detailed
- **Calming**: Wellness-focused, non-intimidating aesthetic

---

## AI Icon Generator Tools

### Recommended (Free)

| Tool | Best For | Signup | Output | Link |
|------|----------|--------|--------|------|
| **Recraft** | Consistent icon sets | No | PNG/JPG | [recraft.ai](https://www.recraft.ai/generate/icons) |
| **Icons8 Mega Creator** | Vector SVG output | No | SVG/PNG/PDF | [icons8.com](https://icons8.com/make/ai-icon-generator-free) |
| **Perchance** | 3D style icons | No | PNG | [perchance.org](https://perchance.org/ai-icon-generator) |
| **Freepik** | High quality | Yes | PNG | [freepik.com](https://www.freepik.com/ai/icon-generator) |
| **OpenArt** | Variety of styles | Yes | PNG | [openart.ai](https://openart.ai/generator/icon) |

### Tool-Specific Tips

**Recraft** (Best overall choice)
- Generates 6 matching icons at once
- Supports custom HEX color codes
- Use "Flat" or "3D" style preset

**Icons8 Mega Creator**
- Best for SVG (scalable vectors)
- Works directly in browser
- Good for UI icons (timer, mic, chart)

**Perchance**
- Specify "3D style" or "soft 3D" in prompt
- No watermarks
- Good for exercise pose icons

---

## Master Prompt Template

Use this as a base prompt, adjusting for specific icons:

```
Create a [ICON NAME] icon in a soft, rounded 3D pillowy style.

STYLE:
- Soft 3D with subtle gradients (lighter on top, darker on bottom)
- Rounded corners, friendly shapes
- Clean minimalist design
- Calming wellness aesthetic
- Subtle drop shadow for depth

COLORS:
- Primary fill: Sage green gradient (#9AAF91 to #7A8E72)
- Highlights: White inner glow on top edge
- Optional accent: Coral (#D4A59A) for active/highlighted elements
- Background: Transparent

SIZE: 512x512px or larger
FORMAT: PNG with transparency
```

---

## Icons Needed

### Tier 1: Exercise Icons (High Priority)

These are for the 3 AI-tracked exercises with full MediaPipe support:

| Icon | Description | Prompt Keywords |
|------|-------------|-----------------|
| Cat-Camel | Person on all fours with arched/curved spine | "cat cow yoga pose, person on hands and knees, spine arching" |
| Cobra | Person lying prone, upper body lifted | "cobra pose, prone back extension, person lying face down lifting chest" |
| Dead Bug | Person on back, opposite arm/leg extended | "dead bug exercise, supine core exercise, person on back limbs raised" |

### Tier 2: Exercise Category Icons (Medium Priority)

For the 49 voice-guided exercises:

| Icon | Description | Prompt Keywords |
|------|-------------|-----------------|
| Hip Stretch | Hip/leg stretching motion | "hip stretch, clamshell exercise, hip mobility" |
| Shoulder | Arm/shoulder rotation | "shoulder rotation, arm circles, upper body stretch" |
| Core | Core/plank position | "plank exercise, core stability, abdominal exercise" |
| Balance | Single leg stance | "balance exercise, single leg stand, stability" |
| Lower Back | Lumbar stretch | "lower back stretch, lumbar mobility, spine stretch" |
| Neck | Neck stretch/rotation | "neck stretch, cervical mobility, head rotation" |

### Tier 3: UI Icons (Lower Priority)

| Icon | Description | Prompt Keywords |
|------|-------------|-----------------|
| Timer | Stopwatch/countdown | "stopwatch icon, timer, countdown clock" |
| Microphone | Voice assistant | "microphone icon, voice, audio recording" |
| Progress | Analytics/chart | "progress chart, line graph, analytics" |
| Streak | Achievement flame | "streak flame, fire badge, achievement" |
| Play | Start session | "play button, start icon" |
| Pause | Pause session | "pause button icon" |
| Checkmark | Completed | "checkmark, success, completed" |
| Breathing | Meditation/breath | "breathing exercise, meditation, lungs" |

---

## Example Prompts by Tool

### For Recraft (Exercise Icons)

```
Physical therapy exercise icon, cat-camel stretch pose, person on hands and knees with curved spine, soft 3D pillowy style, sage green color #8B9F82, rounded friendly design, wellness aesthetic, transparent background
```

### For Icons8 (UI Icons)

```
Timer stopwatch icon, soft rounded 3D style, sage green #8B9F82, minimal clean design, subtle shadow
```

### For Perchance (3D Style)

```
3D icon of person doing cobra stretch exercise, soft rounded pillowy style, muted sage green and cream colors, friendly non-intimidating, physical therapy wellness app
```

---

## Workflow

1. **Batch by type**: Generate all exercise icons together, then UI icons
2. **Use Recraft first**: For consistent sets of 6
3. **Iterate on style**: Generate 2-3 variations, pick the best
4. **Export settings**:
   - Size: 512x512px minimum (scales down well)
   - Format: PNG with transparency
   - Color mode: RGB

5. **Post-processing** (if needed):
   - Resize to consistent dimensions
   - Adjust colors to exact palette in Figma/image editor
   - Add consistent padding

---

## File Organization

Save generated icons to:

```
assets/icons/
├── exercises/
│   ├── cat-camel.png
│   ├── cobra.png
│   ├── dead-bug.png
│   └── ...
├── ui/
│   ├── timer.png
│   ├── microphone.png
│   ├── progress.png
│   └── ...
└── raw/
    └── (original generations before cleanup)
```

---

## Quality Checklist

Before finalizing each icon:

- [ ] Matches sage green palette (#8B9F82 - #A3B899)
- [ ] Has soft 3D/pillowy appearance
- [ ] Rounded, no sharp edges
- [ ] Transparent background
- [ ] Recognizable at 48x48px (smallest usage)
- [ ] Consistent style with other icons in set
- [ ] No anatomically incorrect poses

---

## Time Estimate

- Tier 1 (3 exercise icons): ~30 min
- Tier 2 (6 category icons): ~45 min
- Tier 3 (8 UI icons): ~30 min
- Post-processing/cleanup: ~30 min

**Total: ~2-3 hours**

---

## References

- App design system: `/src/app/globals.css`
- UI design notes: `/assets/ui-screenshots/UI-DESIGN-NOTES.md`
- Tailwind config: `/tailwind.config.ts`
