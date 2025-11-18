# PathFinder Shillong - Design System Guide

## Color Palette

### Primary Colors
- **Primary Green**: `#0B6B3A` / `hsl(151, 82%, 23%)` - Main brand color
- **Primary Green Light**: `#0F8B4A` / `hsl(151, 82%, 31%)` - Hover states
- **Accent Gold**: `#D69E2E` / `hsl(45, 78%, 51%)` - CTAs and highlights
- **Accent Gold Dark**: `#B8861F` / `hsl(45, 75%, 42%)` - Accent hover

### Neutral Colors
- **Background**: `#F7F7F5` / `hsl(60, 14%, 96%)` - Soft warm off-white
- **Card Background**: `#FFFFFF` / `hsl(0, 0%, 100%)` - Pure white for cards
- **Text Primary**: `#1A2E1F` / `hsl(151, 40%, 14%)` - Dark green text
- **Text Muted**: `#6B7C72` / `hsl(151, 10%, 46%)` - Secondary text
- **Border**: `#E2E8E4` / `hsl(151, 20%, 90%)` - Subtle borders

### Semantic Colors
- **Success**: `#22C55E` - Success states
- **Warning**: `#F59E0B` - Warning states  
- **Error**: `#EF4444` - Error states
- **Info**: `#3B82F6` - Info states

## Typography

### Font Families
- **Primary (Sans-serif)**: `'Inter', system-ui, -apple-system, sans-serif`
- **Display (Headers)**: `'Sora', 'Inter', sans-serif`

### Font Sizes
- **Heading 1**: `3.5rem / 56px` (mobile: `2.5rem / 40px`)
- **Heading 2**: `2.5rem / 40px` (mobile: `2rem / 32px`)
- **Heading 3**: `1.875rem / 30px` (mobile: `1.5rem / 24px`)
- **Body Large**: `1.125rem / 18px`
- **Body**: `1rem / 16px`
- **Body Small**: `0.875rem / 14px`
- **Caption**: `0.75rem / 12px`

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing Scale

Uses 4px base unit:
- **xs**: `0.25rem / 4px`
- **sm**: `0.5rem / 8px`
- **md**: `1rem / 16px`
- **lg**: `1.5rem / 24px`
- **xl**: `2rem / 32px`
- **2xl**: `3rem / 48px`
- **3xl**: `4rem / 64px`

## Border Radius
- **Small**: `4px`
- **Default**: `8px`
- **Medium**: `12px`
- **Large**: `16px`
- **Full**: `9999px`

## Shadows

### Elevation System
- **sm**: `0 1px 2px 0 rgba(11, 107, 58, 0.05)`
- **md**: `0 4px 6px -1px rgba(11, 107, 58, 0.1), 0 2px 4px -1px rgba(11, 107, 58, 0.06)`
- **lg**: `0 10px 15px -3px rgba(11, 107, 58, 0.1), 0 4px 6px -2px rgba(11, 107, 58, 0.05)`
- **xl**: `0 20px 25px -5px rgba(11, 107, 58, 0.1), 0 10px 10px -5px rgba(11, 107, 58, 0.04)`
- **glow**: `0 0 20px rgba(214, 158, 46, 0.3)` - For accent highlights

## Button States

### Primary Button (Green)
- **Default**: Green (#0B6B3A) background, white text
- **Hover**: Scale 1.02, brighter green (#0F8B4A), subtle shadow
- **Active**: Scale 0.98
- **Focus**: 2px gold outline
- **Disabled**: 50% opacity, no pointer events

### Secondary Button (Outlined)
- **Default**: Transparent background, green border, green text
- **Hover**: Green background, white text, scale 1.02
- **Active**: Scale 0.98
- **Focus**: 2px gold outline

### Accent Button (Gold)
- **Default**: Gold (#D69E2E) background, dark green text
- **Hover**: Darker gold (#B8861F), scale 1.02, glow shadow
- **Active**: Scale 0.98
- **Focus**: 2px green outline

## Micro-interactions

### Hover Transitions
- **Duration**: 200ms
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Properties**: `transform`, `background-color`, `box-shadow`, `color`

### Card Hover
- **Transform**: `translateY(-4px)`
- **Shadow**: Elevation increases from `md` to `lg`
- **Duration**: 200ms

### CTA Pulse Animation
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(214, 158, 46, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(214, 158, 46, 0); }
}
```

### Page Transitions
- **Fade**: 300ms opacity transition
- **Slide**: 300ms translateX/Y with fade
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

## Form Validation States

### Input States
- **Default**: Gray border (#E2E8E4)
- **Focus**: Green border (#0B6B3A), 2px border, subtle shadow
- **Error**: Red border (#EF4444), red text helper
- **Success**: Green border (#22C55E), green checkmark icon
- **Disabled**: Gray background, reduced opacity

### Validation Rules (Admin)
- **Password**: Minimum 10 characters, show inline counter
- **Phone**: Exactly 10 digits, numeric only, auto-format
- **Email**: Standard email regex, show @ symbol indicator

### Helper Text
- **Default**: Small gray text below input
- **Error**: Red text with icon
- **Success**: Green text with checkmark

## Iconography

### Icon Library
- **Primary**: Lucide React icons
- **Size Scale**: 16px (sm), 20px (md), 24px (lg), 32px (xl)
- **Stroke Width**: 2px default, 1.5px for large icons

### Common Icons
- **MapPin**: Location markers
- **Car**: Transportation
- **Shield**: Security/verification
- **Star**: Ratings
- **Heart**: Favorites
- **User**: Profile
- **Menu**: Navigation toggle

## Category Tags

### Visual Style
- **Padding**: 6px 12px
- **Radius**: 999px (pill shape)
- **Font**: 12px, 600 weight
- **Border**: 1px solid matching color

### Category Colors
- **Places**: Green (#0B6B3A)
- **Food**: Orange (#F59E0B)
- **Markets**: Purple (#8B5CF6)
- **Handicrafts**: Blue (#3B82F6)

## Grid & Layout

### Breakpoints
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### Container
- **Max Width**: 1280px
- **Padding**: 16px (mobile), 24px (tablet), 32px (desktop)

### Grid Columns
- **Mobile**: 1 column
- **Tablet**: 2-3 columns
- **Desktop**: 3-4 columns

## Role-Specific UI

### Driver View
- Remove standard "Plan Trip" CTA
- Add "Book For Someone Else" button (outlined, secondary style)
- Show quick actions: "View Rides", "Earnings" (horizontal cards)
- Dashboard badge: Green with "Driver" label

### Admin View
- Enhanced form validation with inline messages
- Visual distinction: Small admin badge (gold) on forms
- Stricter input rules with real-time feedback
- Additional fields visible only to admin role

## Demo Mode Indicators

### Visual Treatment
- **Badge**: Pill with gray background, small text
- **Text**: "DEMO MODE - Sample data only"
- **Position**: Top-right corner or below primary heading
- **Color**: Muted gray (#6B7C72)

## Accessibility

### Focus States
- **Visible**: 2px outline, contrasting color
- **Keyboard Navigation**: Tab order follows visual hierarchy
- **Touch Targets**: Minimum 44x44px

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Important CTAs meet AAA standards (7:1)

## Loading States

### Skeleton Screens
- Use subtle gray backgrounds (#E2E8E4)
- Animate with shimmer effect
- Match content shape and size

### Spinners
- Green primary color
- Smooth rotation animation
- 32px default size
