# recus-react-native

<p align="center">
  <img src="https://recus.app/logo-dark.png" width="80" height="80" alt="Recus logo" />
</p>

<p align="center">
  <strong>Onboarding infrastructure for React Native.</strong><br />
  Install once. Control everything from a dashboard. No App Store release needed.
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

## What is Recus?

Recus is an onboarding SDK for React Native apps. You install one package, wrap your app with `RecusAppProvider`, and from that point your entire onboarding flow — every screen, every input field, every animation, every validation rule — is controlled from the **Recus dashboard**.

**No code changes. No App Store submissions. No Jira tickets.**

Your PM adds a field tomorrow morning. By afternoon every user who opens the app sees it.

### The problem Recus solves

Every React Native team building onboarding faces the same cycle:

```
PM wants to change onboarding
  → files Jira ticket
    → dev picks it up next sprint
      → PR, QA, App Store review
        → ships in 2 weeks
          → PM has forgotten why they needed it
```

With Recus, that cycle becomes:

```
PM wants to change onboarding
  → opens Recus dashboard
    → makes the change
      → hits publish
        → live in 60 seconds
```

### How it works

1. **Install the SDK** — one npm package, no native linking required
2. **Create your flow** — design onboarding screens in the Recus dashboard
3. **Wrap your app** — `RecusAppProvider` handles everything automatically
4. **Ship changes instantly** — update flows from the dashboard, no release needed

---

## Quick Start

### 1. Install

```bash
npm install recus-react-native
# or
yarn add recus-react-native
# or
pnpm add recus-react-native
```

> **Compatibility:** Expo SDK 49+ and bare React Native 0.72+. No native linking required.

### 2. Create your Recus account

1. Go to **[recus.app](https://recus.app)** and sign up
2. Click **"New App"** and give it a name (e.g. "My Health App")
3. Go to **Settings → SDK Keys** and copy your **publishable key** (starts with `pk_live_`)
4. Go to **Flows → New Flow** and create your first onboarding flow

> ⚠️ Your publishable key (`pk_live_...`) is safe to include in your app. Never use your secret key (`sk_live_...`) in client-side code.

### 3. Wrap your app

**Expo Router (`app/_layout.tsx`):**

```tsx
import { RecusAppProvider } from 'recus-react-native'
import { Stack } from 'expo-router'

export default function RootLayout() {
  const { user } = useAuth() // your own auth

  return (
    <RecusAppProvider
      sdkKey="pk_live_xxxxxxxxxxxxxxxxxxxx"
      user={user ? {
        userId: user.id,        // required
        email:  user.email,     // optional
        name:   user.name,      // optional
      } : undefined}
    >
      <Stack />
    </RecusAppProvider>
  )
}
```

**React Navigation (`App.tsx`):**

```tsx
import { RecusAppProvider } from 'recus-react-native'
import { NavigationContainer } from '@react-navigation/native'

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

That's it. Run your app, sign in with a test user, and your onboarding flow will appear automatically.

---

## How RecusAppProvider works

`RecusAppProvider` sits above your entire app as an invisible layer.

- When `user` is `undefined` — Recus does nothing. Zero performance impact.
- When `user.userId` is set — Recus checks if that user needs to complete onboarding
- If onboarding is needed — the flow appears above your app (native view, not a modal)
- If onboarding is complete — Recus stays invisible forever
- If the Recus API is down — Recus fails silently. **Your app always works.**

Your existing navigation, routing, and component tree are never modified.

---

## Creating an Account on Recus.app

### Step 1 — Sign up

Visit **[recus.app](https://recus.app)** and create a free account. No credit card required.

### Step 2 — Create an App

An **App** in Recus represents one of your React Native applications.

- Click **"New App"**
- Give it a name (e.g. "DonorApp iOS")
- Each App has its own SDK key and user database

### Step 3 — Get your SDK Key

Inside your App → **Settings → SDK Keys**

| Key | Prefix | Where to use |
|-----|--------|-------------|
| Publishable key | `pk_live_` | In your React Native app ✓ |
| Secret key | `sk_live_` | On your backend server only |

### Step 4 — Create a Flow

A **Flow** is the sequence of screens your users move through.

1. Click **"New Flow"** inside your App
2. Add screens — each screen can have a background (solid, gradient, image), inputs, and a button
3. Configure inputs — text, email, phone, dropdowns, option cards, date pickers, and more
4. Set validation rules and mark fields as mandatory
5. Click **"Publish"** — changes go live instantly

### Step 5 — Test it

Run your app with a test user. The flow will appear when `user.userId` is set. Complete the flow — it will never appear again for that user.

---

## API Reference

### RecusAppProvider

The root provider. Wrap your entire app with this once.

```tsx
import { RecusAppProvider } from 'recus-react-native'

<RecusAppProvider
  sdkKey="pk_live_xxx"    // your publishable key — required
  user={user}             // RecusUser | undefined — required
  onComplete={(values) => console.log('Done:', values)}  // optional
  onSkip={(screenId) => console.log('Skipped:', screenId)} // optional
>
  <YourApp />
</RecusAppProvider>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sdkKey` | `string` | ✓ | Your publishable key from the dashboard |
| `user` | `RecusUser \| undefined` | ✓ | Your authenticated user. Pass `undefined` when logged out |
| `onComplete` | `(values: Record<string, any>) => void` | — | Called when the user completes a flow |
| `onSkip` | `(screenId: string) => void` | — | Called when the user skips a screen |

---

### RecusUser type

```typescript
type RecusUser = {
  userId: string        // required — your user's ID
  email?:  string       // optional
  name?:   string       // optional
  [key: string]: unknown // any additional metadata
}
```

**Important:** Always use your own user IDs. Recus stores all data against your IDs so you can join it with your database without any mapping.

---

### useRecusStatus

Check onboarding status from anywhere in your app.

```tsx
import { useRecusStatus } from 'recus-react-native'

function ProfileScreen() {
  const { isComplete, isLoading } = useRecusStatus()

  if (isLoading) return <Spinner />

  return (
    <View>
      {!isComplete && (
        <Banner text="Complete your profile to unlock all features" />
      )}
      <ProfileContent />
    </View>
  )
}
```

**Returns:**

| Value | Type | Description |
|-------|------|-------------|
| `isComplete` | `boolean` | `true` if user has completed the active mandatory flow |
| `isLoading` | `boolean` | `true` while checking the user's status |
| `error` | `Error \| null` | Set if the status check failed |

---

### useRecusField

Connect any component to a specific field in the current onboarding screen.

```tsx
import { useRecusField } from 'recus-react-native'

function BloodGroupPicker() {
  const { value, error, onChange } = useRecusField('inp_blood_group')

  return (
    <View>
      {['A+', 'B+', 'O+', 'AB+'].map(group => (
        <TouchableOpacity
          key={group}
          onPress={() => onChange(group)}
          style={[styles.card, value === group && styles.selected]}
        >
          <Text>{group}</Text>
        </TouchableOpacity>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}
```

**Returns:**

| Value | Type | Description |
|-------|------|-------------|
| `value` | `any` | Current field value |
| `error` | `string \| undefined` | Validation error message |
| `onChange` | `(value: any) => void` | Update the field value |
| `onFocus` | `() => void` | Call when the field gains focus |
| `onBlur` | `() => void` | Call when the field loses focus |
| `isValid` | `boolean` | Whether the current value passes validation |

---

### useRecusNavigation

Access navigation actions from inside the onboarding flow.

```tsx
import { useRecusNavigation } from 'recus-react-native'

function CustomCTA() {
  const { nextScreen, completeFlow, isLastScreen, isSubmitting } = useRecusNavigation()

  return (
    <TouchableOpacity
      onPress={isLastScreen ? completeFlow : nextScreen}
      disabled={isSubmitting}
    >
      <Text>{isLastScreen ? 'Get started' : 'Continue'}</Text>
    </TouchableOpacity>
  )
}
```

---

## Custom UI with Hooks

Recus is headless by default. You can build entirely custom screens using the provided hooks — Recus handles all the data, validation, navigation, and analytics while you own every pixel.

### Using the component registry

Register your own components once. Recus renders them for the matching field types.

```tsx
<RecusAppProvider
  sdkKey="pk_live_xxx"
  user={user}
  componentRegistry={{
    text:            MyTextInput,
    email:           MyEmailInput,
    phone:           MyPhoneInput,
    boolean:         MyToggle,
    dob_picker:      MyDatePicker,      // custom key
    gender_selector: MyGenderSelector, // custom key
    blood_group:     MyBloodGroupPicker,
  }}
>
```

Your component receives:

```tsx
type RecusInputProps = {
  input:    InputConfig  // field config from schema
  value:    any          // current value
  onChange: (v: any) => void
  error?:   string
}

function MyTextInput({ input, value, onChange, error }: RecusInputProps) {
  return (
    <View>
      <Text>{input.label}</Text>
      <TextInput
        value={value ?? ''}
        onChangeText={onChange}
        placeholder={input.placeholder}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}
```

---

## Pricing

| Plan | Price | MAUs | Key features |
|------|-------|------|-------------|
| **Starter** | Free | 500 | 1 flow, basic analytics, Recus badge |
| **Growth** | $79/mo annual · $99/mo monthly | 5,000 | Unlimited flows, analytics, webhooks, white-label |
| **Pro** | $199/mo annual · $249/mo monthly | 25,000 | Multiple apps, SSO, priority support |

Overage: $8 per 1,000 additional MAUs. Never hard cut off — 7-day grace period always applies.

---

## Frequently Asked Questions

**Does Recus work with Expo Go?**
Yes. Recus has no native dependencies and works with Expo Go out of the box.

**Does Recus modify my navigation?**
No. Recus sits above your app as an absolutelyPositioned native view. Your navigation, routes, and component tree are completely untouched.

**What happens if the Recus API is down?**
Recus fails silently. Your app continues working normally. Onboarding will appear once the API is reachable again.

**Can I use my own components?**
Yes — that's the recommended approach. Pass your components via `componentRegistry` and Recus renders them with your brand's exact look and feel.

**Where is user data stored?**
All submitted field values are stored against your own user IDs on Recus infrastructure. You can retrieve them via the API or receive them via webhooks on flow completion.

**Does Recus support multiple flows?**
Yes. Each App can have multiple flows. The active mandatory flow is shown to users who haven't completed it.

**Can I A/B test onboarding flows?**
A/B testing is available on the Growth plan and above.

---

## Troubleshooting

**Onboarding is not appearing**

Check in order:
1. Is `user.userId` set? Log it: `console.log('[debug] user:', user)`
2. Is there an active mandatory flow in your dashboard?
3. Has this user already completed the flow? Check the dashboard → Users
4. Is your SDK key correct? It must start with `pk_live_` or `pk_test_`

**Onboarding appeared once but never again**

This is correct. Once a user completes a flow, Recus caches the completion state. To reset for testing:

```tsx
import { useRecusStatus } from 'recus-react-native'
const { reset } = useRecusStatus()
reset() // clears local cache — onboarding will appear again
```

**"RecusAppProvider must be at the root"**

Make sure `RecusAppProvider` wraps your entire app including `NavigationContainer`:

```tsx
// ✓ Correct
<RecusAppProvider sdkKey="..." user={user}>
  <NavigationContainer>
    <Stack />
  </NavigationContainer>
</RecusAppProvider>

// ✗ Wrong
<NavigationContainer>
  <RecusAppProvider sdkKey="..." user={user}>
    <Stack />
  </RecusAppProvider>
</NavigationContainer>
```

---

## Links

- 📖 **Docs:** [recus.app/docs](https://recus.app/docs)
- 🖥️ **Dashboard:** [app.recus.app](https://app.recus.app)
- 📦 **npm:** [npmjs.com/package/recus-react-native](https://www.npmjs.com/package/recus-react-native)
- 🐛 **Issues:** [github.com/recusapp/recus-react-native/issues](https://github.com/recusapp/recus-react-native/issues)
- 🐦 **X:** [@recusapp](https://x.com/recusapp)
- 💬 **Support:** support@recus.app

---

## License

MIT © [Recus](https://recus.app)