# Rencana Optimasi Mobile App "Kas Rasi" - ANDROID FOCUS

## Masalah yang Teridentifikasi untuk Android:

### 1. **Android Status Bar & Navigation**
- Header sticky tertutupi status bar Android
- Need padding-top untuk Android status bar
- Bottom navigation area (gesture area)

### 2. **Android Keyboard Issues**
- Keyboard virtual menutupi input form
- Input terhalang keyboard saat typing
- Need proper viewport handling untuk Android keyboard

### 3. **Android Touch Targets**
- Button size tidak optimal untuk finger touch
- Minimum 48dp untuk Android Material Design
- Better spacing untuk touch

### 4. **Android Performance**
- Scroll performance di Android
- Touch response time
- View rendering optimization

## Plan Perbaikan Android:

### ✅ Phase 1: Android Layout Fix - COMPLETED
1. ✅ Update Layout.tsx dengan Android status bar padding
2. ✅ Fix container max-width untuk Android screens  
3. ✅ Add Android-specific safe areas
4. ✅ Add keyboard detection dan responsive header

### ✅ Phase 2: Android Input Optimization - COMPLETED  
5. ✅ Fix ExpenseForm.tsx untuk Android keyboard
6. ✅ Auto-scroll ke input saat keyboard muncul
7. ✅ Optimize input sizes (48dp minimum)
8. ✅ Add Android keyboard event handlers

### ✅ Phase 3: Android Touch & UX - COMPLETED
9. ✅ Perbesar button sizes untuk finger touch (min 44px)
10. ✅ Better spacing untuk Android interaction
11. ✅ Optimize AdminDashboard untuk Android scroll
12. ✅ Add touch-manipulation dan hover states

### ✅ Phase 4: Android Meta & Config - COMPLETED
13. ✅ Update index.html dengan Android-optimized meta
14. ✅ Add Android PWA support (manifest.json)
15. ✅ Add Android viewport optimization
16. ✅ Add Android safe area classes

## Android-Specific Files:
- `src/components/Layout.tsx` (status bar fix)
- `src/components/ExpenseForm.tsx` (keyboard handling)
- `src/components/AdminDashboard.tsx` (touch optimization)
- `index.html` (Android meta tags)

## Android Testing:
- Test di Android 8+ devices
- Test dengan berbagai keyboard types
- Test portrait/landscape orientation
- Test pada physical Android device
