# recus-react-native

<p align="center">
  <img src="https://www.recus.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Frecus-mark-light-800%20(1).0wq0ynk~rnkz8.png&amp;w=48&amp;q=75" width="80" height="80" alt="Recus logo" />
</p>

<p align="center">
  <strong>Animated onboarding infrastructure for React Native.</strong><br />
  Install the SDK once, then build, animate, validate, and publish complete onboarding flows from Recus.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/recus-react-native">
    <img src="https://img.shields.io/npm/v/recus-react-native?color=F59E0B&label=npm" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/recus-react-native">
    <img src="https://img.shields.io/npm/dm/recus-react-native?color=F59E0B" alt="npm downloads" />
  </a>
  <a href="https://recus.app/docs">
    <img src="https://img.shields.io/badge/docs-recus.app-F59E0B" alt="documentation" />
  </a>
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey" alt="platform" />
  <img src="https://img.shields.io/badge/expo-compatible-blue" alt="expo compatible" />
</p>

---

## Tutorial

<p align="center">
  <video src="https://www.recus.app/mvp.mp4" controls width="720">
    Your browser does not support the video tag.
  </video>
</p>

[Watch the tutorial video](https://www.recus.app/mvp.mp4)

---

## What Recus Does

Recus lets a React Native app render onboarding from a server-driven flow. Your app ships a single provider, and Recus handles the rest: SDK key validation, user sync, flow assignment, native rendering, input state, validation, animated transitions, resume state, completion, and analytics.

The latest SDK UI engine supports dashboard-authored screens with:

- Solid, image, linear gradient, and radial gradient backgrounds.
- Freeform or flow-based `text`, `image`, `input`, and `button` layers.
- Per-layer entrance animations for copy, media, inputs, and buttons.
- Text, password, email, number, phone, URL, date, textarea, boolean, and radio inputs.
- Single-select and multi-select radio-style options.
- Conditional transitions, conditional screen entry, disabled button expressions, and templated text.
- Back navigation through dashboard-authored back buttons, Android hardware back, and iOS edge swipe when enabled.

This means a team can create or change a complete onboarding journey without changing app code or waiting for an App Store release.

---

## Install

```bash
npm install recus-react-native
```

If your app does not already include the peer packages used by the SDK renderer, install them too:

```bash
npm install @react-native-async-storage/async-storage @tanstack/react-query zustand expo-linear-gradient react-native-svg
```

For Expo apps, use `npx expo install` for native packages:

```bash
npx expo install @react-native-async-storage/async-storage expo-linear-gradient react-native-svg
npm install @tanstack/react-query zustand recus-react-native
```

Compatibility target: React 18+, React Native 0.72+, and Expo SDK 49+.

---

## Quick Start

### 1. Create Your Recus App

1. Sign up at [recus.app](https://recus.app).
2. Create a new App for your React Native product.
3. Copy the publishable SDK key from the App settings. Publishable keys usually start with `pk_live_` or `pk_test_`.
4. Create and publish your first onboarding flow.

Only use the publishable key in your app. Secret keys belong on your backend.

### 2. Wrap Your App

`RecusAppProvider` should sit above your app navigation so the onboarding layer can render over the full application.

Expo Router:

```tsx
import { Stack } from 'expo-router'
import { RecusAppProvider } from 'recus-react-native'

export default function RootLayout() {
  const { user } = useAuth()

  return (
    <RecusAppProvider
      sdkKey="pk_live_xxxxxxxxxxxxxxxxxxxx"
      user={
        user
          ? {
              userId: user.id,
              email: user.email,
              name: user.name,
            }
          : undefined
      }
    >
      <Stack />
    </RecusAppProvider>
  )
}
```

React Navigation:

```tsx
import { NavigationContainer } from '@react-navigation/native'
import { RecusAppProvider } from 'recus-react-native'

export default function App() {
  const { user } = useAuth()

  return (
    <RecusAppProvider
      sdkKey="pk_live_xxxxxxxxxxxxxxxxxxxx"
      user={user ? { userId: user.id, email: user.email } : undefined}
    >
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </RecusAppProvider>
  )
}
```

When `user.userId` becomes available, Recus loads the assigned flow. If the user has not completed onboarding, the flow appears above your app as a native overlay.

---

## How the Provider Works

`RecusAppProvider` is the integration point between your app and Recus.

It automatically:

- Authenticates the SDK key.
- Fetches the active app onboarding flow.
- Prefetches image assets before showing the flow.
- Creates or reuses the Recus app user for your `user.userId`.
- Loads assigned onboarding data and resume state for that user.
- Persists the current screen as the user moves through onboarding.
- Stores submitted input values, screen-time analytics, and completion state.
- Hides itself when the user is logged out, onboarding is not ready, or onboarding is complete.

Your app navigation is not replaced or mutated. Recus renders a separate absolute overlay only when onboarding should be active.

---

## Building an Onboarding Flow

A Recus onboarding flow is a list of screens. Each screen can use the dashboard UI engine by providing a `ui` config with a canvas, background, and layers.

At a high level, a custom screen looks like this:

```json
{
  "id": "welcome",
  "ui": {
    "schemaVersion": "1.0",
    "canvas": {
      "width": 390,
      "height": 844,
      "device": "iphone"
    },
    "background": {
      "type": "gradient",
      "gradient": {
        "type": "radial",
        "angle": 0,
        "stops": [
          { "color": "#FFF7ED", "position": 0 },
          { "color": "#FDBA74", "position": 1 }
        ]
      }
    },
    "layers": []
  },
  "inputs": [],
  "transitions": [{ "to": "profile", "backAllowed": true }]
}
```

The SDK normalizes loose dashboard JSON before rendering it. Missing optional values use safe defaults, malformed layers are ignored, and unsupported input types fall back to `text`.

---

## Layer Types

Every rendered object is a layer. Layers can be absolutely positioned with `freeform` layout or placed in document flow with `flow` layout.

Common layout fields:

```json
{
  "position": "freeform",
  "x": "10%",
  "y": "20%",
  "width": "80%",
  "height": "hug",
  "zIndex": 2
}
```

Supported dimensions are numbers, percentages such as `"80%"`, `"fill"`, and `"hug"`.

### Text Layers

Use text layers for headings, body copy, helper text, and dynamic copy.

```json
{
  "id": "headline",
  "type": "text",
  "content": "Welcome, {{ firstName }}",
  "layout": { "position": "freeform", "x": "8%", "y": "12%", "width": "84%", "height": "hug" },
  "animation": { "preset": "slide-up", "durationMs": 420, "delayMs": 80, "easing": "ease-out" },
  "style": {
    "color": "#111827",
    "opacity": 1,
    "fontSize": 32,
    "fontWeight": "800",
    "fontStyle": "normal",
    "textAlign": "center",
    "lineHeight": 1.2,
    "letterSpacing": -0.4,
    "textTransform": "none",
    "textDecoration": "none"
  }
}
```

Text supports template interpolation from onboarding values using `{{ fieldId }}`. Arrays can also be joined with `{{ interests.join(", ") }}`.

### Image Layers

Use image layers for illustrations, avatars, product screenshots, or branded graphics.

```json
{
  "id": "hero",
  "type": "image",
  "source": { "url": "https://cdn.example.com/onboarding/hero.png" },
  "alt": "Product preview",
  "layout": { "position": "freeform", "x": "15%", "y": "24%", "width": "70%", "height": 220 },
  "animation": { "preset": "zoom-in", "durationMs": 380, "delayMs": 160, "easing": "ease-out" },
  "style": {
    "opacity": 1,
    "objectFit": "cover",
    "objectPosition": "center",
    "shape": "rounded",
    "borderRadius": 24,
    "borderWidth": 0,
    "borderColor": "#000000",
    "shadow": { "color": "#000000", "x": 0, "y": 10, "blur": 24 }
  }
}
```

Supported image fit values are `cover`, `contain`, `fill`, `none`, and `scale-down`. Positions include `top`, `bottom`, `left`, `right`, `center`, and corner positions.

### Input Layers

Input layers connect directly to the screen input state and validation system.

```json
{
  "id": "email-input",
  "type": "input",
  "fieldId": "email",
  "label": "Email",
  "required": true,
  "inputType": "email",
  "placeholder": "you@example.com",
  "layout": { "position": "freeform", "x": "8%", "y": "48%", "width": "84%", "height": 56 },
  "animation": { "preset": "fade-in", "durationMs": 260, "delayMs": 220, "easing": "ease-out" },
  "style": {
    "fontSize": 16,
    "labelSize": 13,
    "textColor": "#111827",
    "labelColor": "#374151",
    "borderColor": "#E5E7EB",
    "borderWidth": 1,
    "borderRadius": 12,
    "backgroundColor": "#FFFFFF",
    "placeholderColor": "#9CA3AF"
  }
}
```

Supported input types are `text`, `password`, `email`, `number`, `phone`, `tel`, `url`, `date`, `textarea`, `boolean`, and `radio`.

Radio inputs support single or multiple selection:

```json
{
  "id": "interests",
  "type": "input",
  "fieldId": "interests",
  "label": "What are you interested in?",
  "required": true,
  "inputType": "radio",
  "selectionMode": "multiple",
  "options": [
    { "id": "fitness", "label": "Fitness", "value": "fitness" },
    { "id": "nutrition", "label": "Nutrition", "value": "nutrition" },
    { "id": "sleep", "label": "Sleep", "value": "sleep" }
  ],
  "layout": { "position": "freeform", "x": "8%", "y": "36%", "width": "84%", "height": 220 },
  "style": {
    "fontSize": 15,
    "labelSize": 13,
    "textColor": "#111827",
    "labelColor": "#374151",
    "borderColor": "#E5E7EB",
    "borderWidth": 1,
    "borderRadius": 14,
    "backgroundColor": "#FFFFFF",
    "placeholderColor": "#9CA3AF",
    "optionStyle": {
      "selected": { "backgroundColor": "#FEF3C7", "textColor": "#92400E", "borderColor": "#F59E0B" },
      "unselected": { "backgroundColor": "#FFFFFF", "textColor": "#111827", "borderColor": "#E5E7EB" },
      "borderRadius": 12,
      "gap": 8
    }
  }
}
```

### Button Layers

Button layers can use semantic `buttonType` values or explicit tap actions.

```json
{
  "id": "continue-button",
  "type": "button",
  "label": "Continue",
  "buttonType": "continue",
  "disabled": "!email",
  "variant": "primary",
  "layout": { "position": "freeform", "x": "8%", "y": "84%", "width": "84%", "height": 56 },
  "animation": { "preset": "pop", "durationMs": 360, "delayMs": 320, "easing": "ease-out" },
  "style": {
    "background": {
      "type": "linear-gradient",
      "angle": 90,
      "stops": [
        { "color": "#F59E0B", "position": 0 },
        { "color": "#FB923C", "position": 1 }
      ]
    },
    "textColor": "#FFFFFF",
    "borderColor": "#F59E0B",
    "borderWidth": 0,
    "borderRadius": 16,
    "fontSize": 16,
    "fontWeight": "700",
    "shadow": { "color": "#F59E0B", "x": 0, "y": 8, "blur": 18 }
  }
}
```

Reserved button types are:

- `continue`: validates the current screen, submits values, and follows the next matching transition or completes the flow.
- `skip`: advances without validating the current screen.
- `back`: returns to the previous screen when the transition into the current screen has `backAllowed: true`.

Buttons can also run explicit actions:

```json
{
  "events": {
    "onTap": [
      { "action": "validate", "fieldIds": ["email"] },
      { "action": "submit" },
      { "action": "navigate", "to": "profile" }
    ]
  }
}
```

Supported action names are `navigate`, `validate`, `submit`, and `complete`.

---

## Animations

Every `text`, `image`, `input`, and `button` layer can include an `animation` object.

```json
{
  "animation": {
    "preset": "slide-up",
    "durationMs": 300,
    "delayMs": 120,
    "easing": "ease-out"
  }
}
```

Supported presets:

| Preset | Best used for | Behavior |
|--------|---------------|----------|
| `fade-in` | Body copy, helper text, subtle UI | Starts transparent and fades to full opacity |
| `slide-up` | Headlines, cards, form fields | Starts slightly below and slides into place |
| `slide-down` | Top banners, alerts | Starts slightly above and slides into place |
| `slide-left` | Right-side content, sequential cards | Starts to the right and slides left into place |
| `slide-right` | Back affordances, left-side content | Starts to the left and slides right into place |
| `zoom-in` | Hero images, illustrations | Starts slightly smaller and scales to full size |
| `pop` | Primary buttons, badges, success states | Scales past full size briefly, then settles |
| `bounce` | Playful illustrations or prompts | Uses a spring on vertical movement |
| `pulse` | Calls to action or attention hints | Briefly scales up and returns |

Supported easing values are `linear`, `ease`, `ease-in`, `ease-out`, and `ease-in-out`. If easing is omitted, the SDK uses `ease-out`. If duration is omitted, the SDK uses `300ms`. If delay is omitted, the SDK uses `0ms`.

Animation is implemented with React Native's `Animated` native driver for opacity and transforms. The SDK also respects the OS reduce-motion setting: when reduce motion is enabled, animated layers render immediately in their final state.

### Animation Recipes

Use staggered delays to make a screen feel intentional:

```json
[
  { "id": "headline", "animation": { "preset": "slide-up", "durationMs": 420, "delayMs": 0, "easing": "ease-out" } },
  { "id": "hero", "animation": { "preset": "zoom-in", "durationMs": 360, "delayMs": 120, "easing": "ease-out" } },
  { "id": "email", "animation": { "preset": "fade-in", "durationMs": 260, "delayMs": 220, "easing": "ease-out" } },
  { "id": "continue", "animation": { "preset": "pop", "durationMs": 360, "delayMs": 320, "easing": "ease-out" } }
]
```

Good defaults:

- Marketing welcome screen: `slide-up` headline, `zoom-in` image, `pop` button.
- Form screen: `fade-in` labels and inputs, `slide-up` button.
- Success screen: `bounce` illustration, `fade-in` copy, `pulse` final CTA.
- Preference picker: `slide-up` title, `fade-in` options, `pop` continue button.

---

## Backgrounds

Screens can use solid, image, linear gradient, or radial gradient backgrounds.

Solid:

```json
{ "type": "solid", "color": "#FFFFFF" }
```

Linear gradient:

```json
{
  "type": "gradient",
  "gradient": {
    "type": "linear",
    "angle": 180,
    "stops": [
      { "color": "#FFF7ED", "position": 0 },
      { "color": "#FDBA74", "position": 1 }
    ]
  }
}
```

Radial gradient:

```json
{
  "type": "gradient",
  "gradient": {
    "type": "radial",
    "angle": 0,
    "stops": [
      { "color": "#FFFFFF", "position": 0 },
      { "color": "#F59E0B", "position": 1 }
    ]
  }
}
```

Image background with overlay:

```json
{
  "type": "image",
  "image": {
    "url": "https://cdn.example.com/onboarding/background.jpg",
    "fit": "cover",
    "position": "center",
    "overlay": {
      "color": "#000000",
      "opacity": 0.35
    }
  }
}
```

---

## Validation and Conditions

Inputs support required checks, min and max length checks, type-specific validation, and validation rules from the flow payload.

Built-in validations include:

- `email`: must look like an email address.
- `number`: must be numeric.
- `phone` and `tel`: must look like a phone number.
- `url`: must start with `http://` or `https://`.
- `boolean`: must be `true` when required.
- `radio`: must have at least one selected value when required.

Validation rules can be attached to a screen input:

```json
{
  "id": "age",
  "label": "Age",
  "type": "number",
  "required": true,
  "validation": {
    "rules": [
      { "type": "min", "value": 18, "message": "You must be at least 18." },
      { "type": "max", "value": 120, "message": "Please enter a valid age." }
    ]
  }
}
```

Expressions can drive transitions, disabled states, and screen conditions.

Examples:

```json
{
  "transitions": [
    { "to": "student-plan", "condition": "role == 'student'", "backAllowed": true },
    { "to": "default-plan", "condition": "role != 'student'", "backAllowed": true }
  ]
}
```

```json
{
  "conditions": {
    "expression": "acceptedTerms == true",
    "elseGoTo": "terms"
  }
}
```

Expression helpers include comparisons (`==`, `!=`, `>`, `>=`, `<`, `<=`), boolean logic (`&&`, `||`, `!`), `.length`, `.includes("value")`, and `.join(", ")` for arrays.

---

## Navigation and Persistence

Recus onboarding navigation is isolated from your app navigation.

- Forward transitions slide the next screen in after the screen has mounted.
- The SDK waits one animation frame before starting the slide so image-heavy custom UI screens avoid first-render jitter.
- Back navigation is available only when the incoming transition has `backAllowed: true`.
- Android hardware back and iOS edge swipe are supported for allowed back transitions.
- The current route is persisted so users can leave and resume later.
- Completion persists submitted values and per-screen time-spent analytics.

---

## API Reference

### `RecusAppProvider`

```tsx
import { RecusAppProvider } from 'recus-react-native'

<RecusAppProvider sdkKey="pk_live_xxx" user={user}>
  <YourApp />
</RecusAppProvider>
```

Props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sdkKey` | `string` | Yes | Publishable key from your Recus dashboard |
| `user` | `RecusUser \| undefined` | Yes | Authenticated app user, or `undefined` when logged out |
| `children` | `React.ReactNode` | Yes | Your app tree |

### `RecusUser`

```ts
type RecusUser = {
  userId: string
  email?: string
  name?: string
  [key: string]: unknown
}
```

Always pass your own stable user ID. Recus stores onboarding state against your IDs so you can match data back to your own backend.

### `useRecus`

Use `useRecus` inside `RecusAppProvider` when your app needs to inspect onboarding state.

```tsx
import { useRecus } from 'recus-react-native'

function ProfileCompletionBanner() {
  const { isComplete, isOnboardingReady } = useRecus()

  if (isComplete) return null

  return (
    <Banner>
      {isOnboardingReady
        ? 'Complete onboarding to unlock all features.'
        : 'Preparing onboarding...'}
    </Banner>
  )
}
```

Returned values include:

| Value | Description |
|-------|-------------|
| `user` | Normalized active Recus user |
| `onboardingFlow` | Flow assigned to the current app user |
| `screens` | Normalized screen configs |
| `initialRoute` | First screen or persisted resume screen |
| `onboardingValues` | Live input values |
| `submittedValues` | Values submitted for completed screens |
| `analytics` | Local screen-time analytics |
| `isOnboardingReady` | Whether a flow and initial route are ready |
| `isActive` | Whether `user.userId` is set |
| `isNavigationEnabled` | Whether user sync and local hydration are complete |
| `isComplete` | Whether onboarding is complete locally or on the server |

### API Helpers

The package also exports lower-level helpers for custom integrations:

```tsx
import {
  authenticateAppSdk,
  createAppUser,
  getAppOnboarding,
  getAppUserOnboardingData,
  patchAppUserOnboardingData,
} from 'recus-react-native'
```

---

## Complete Onboarding Checklist

Use this flow to add an entire onboarding journey with Recus:

1. Create a Recus App and copy the publishable SDK key.
2. Install the SDK and renderer peer packages.
3. Wrap your app root with `RecusAppProvider`.
4. Pass `undefined` as `user` while logged out and `{ userId }` after login.
5. Create screens in the Recus dashboard.
6. Add backgrounds: solid, image, linear gradient, or radial gradient.
7. Add text layers for headings, body copy, legal copy, and dynamic templates.
8. Add image layers for product visuals, illustrations, and avatars.
9. Add input layers for each piece of data you need to collect.
10. Add validation rules and mark required fields.
11. Add button layers with `continue`, `skip`, and `back` behavior.
12. Add per-layer animations with staggered `delayMs` values.
13. Configure transitions and conditions between screens.
14. Enable `backAllowed` only where users should be able to return.
15. Publish the flow.
16. Test with a new user ID.
17. Complete the flow and verify that it does not reappear for that user.

---

## Troubleshooting

### Onboarding Is Not Appearing

Check these in order:

1. Confirm `user.userId` is set.
2. Confirm the SDK key is a publishable key.
3. Confirm an active flow is published in the Recus dashboard.
4. Confirm the user has not already completed the assigned flow.
5. Check device logs for `Recus SDK Validation` or `Recus SDK Onboarding Loaded`.

### A Screen Shows but a Layer Is Missing

The SDK ignores malformed layers instead of crashing the app. Check that the layer has a supported `type`, valid `layout`, and any required fields such as `content` for text, `source.url` for images, `fieldId` for inputs, or `label` for buttons.

### Animations Are Not Playing

Animations render immediately when the device has reduce motion enabled. Also check that the layer includes a valid `animation.preset`; unknown presets are ignored.

### Back Does Not Work

Back behavior only works when the transition into the current screen has `backAllowed: true`. Add that flag to the previous screen's transition.

### Onboarding Appeared Once and Never Again

That is expected after completion. Use a fresh test `userId` or clear the user's onboarding data while testing.

---

## Links

- Docs: [recus.app/docs](https://recus.app/docs)
- Dashboard: [app.recus.app](https://app.recus.app)
- npm: [npmjs.com/package/recus-react-native](https://www.npmjs.com/package/recus-react-native)
- Issues: [github.com/recusapp/recus-react-native/issues](https://github.com/recusapp/recus-react-native/issues)
- Support: support@recus.app

---

## License

MIT (c) [Recus](https://recus.app)