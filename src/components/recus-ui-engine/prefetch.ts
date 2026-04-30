import { Image as ExpoImage } from 'expo-image'
import { AppOnboardingFlow, AppOnboardingScreenConfig } from '../../api/appOnboarding'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const collectImageUrlFromBackground = (background: unknown): string | undefined => {
  if (!isRecord(background)) return undefined
  if (background.type !== 'image') return undefined
  const image = background.image
  if (!isRecord(image)) return undefined
  const url = image.url
  return typeof url === 'string' && url.trim().length > 0 ? url : undefined
}

const collectImageUrlFromLayer = (layer: unknown): string | undefined => {
  if (!isRecord(layer)) return undefined
  if (layer.type !== 'image') return undefined
  if (!isRecord(layer.source)) return undefined
  const url = layer.source.url
  return typeof url === 'string' && url.trim().length > 0 ? url : undefined
}

const collectImageUrlsFromScreen = (
  screen: AppOnboardingScreenConfig,
): string[] => {
  const ui = screen.ui
  if (!isRecord(ui)) return []
  const urls: string[] = []

  const backgroundUrl = collectImageUrlFromBackground(ui.background)
  if (backgroundUrl) urls.push(backgroundUrl)

  const layers = Array.isArray(ui.layers) ? ui.layers : []
  for (const layer of layers) {
    const layerUrl = collectImageUrlFromLayer(layer)
    if (layerUrl) urls.push(layerUrl)
  }

  return urls
}

/**
 * Walks the entire onboarding flow and returns every distinct image URL the
 * UI engine will eventually need. Used to warm `expo-image`'s disk cache
 * when the flow loads, so the user never waits on a network round trip
 * mid-navigation.
 */
export const collectImageUrls = (flow: AppOnboardingFlow): string[] => {
  const seen = new Set<string>()
  for (const screen of flow.data.screens) {
    for (const url of collectImageUrlsFromScreen(screen)) {
      seen.add(url)
    }
  }
  return Array.from(seen)
}

/**
 * Fire-and-forget prefetch of every image asset referenced by the flow.
 * Resolves to `true` when the cache is warm, `false` if any URL failed
 * (the others may still have succeeded — `expo-image`'s contract).
 *
 * Errors from prefetching are intentionally swallowed: a failed prefetch
 * should never break the onboarding session.
 */
export const prefetchFlowAssets = (flow: AppOnboardingFlow): Promise<boolean> => {
  const urls = collectImageUrls(flow)
  if (urls.length === 0) return Promise.resolve(true)

  return ExpoImage.prefetch(urls, 'memory-disk').catch(error => {
    console.warn('Recus prefetch failed', {
      error: error instanceof Error ? error.message : String(error),
      urlCount: urls.length,
    })
    return false
  })
}
