import type { ActivityMode, AppLanguage, DailyRecommendation, SkinType } from '../types'
import type { DepartureAlertInput } from '../lib/notifications'
import type { TimerPhase } from '../lib/sunscreenTimer'
import {
  isAndroidDevice,
  isIosDevice,
  isStandalonePwa,
  type LocationSettingsGuide,
} from '../lib/geolocation'
import { messages, type MessageTree } from './messages'

export type { MessageTree }

export function localeForLanguage(lang: AppLanguage): string {
  return lang === 'nl' ? 'nl-NL' : 'en-US'
}

function resolve(tree: MessageTree, key: string): string {
  const parts = key.split('.')
  let current: unknown = tree
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return key
    current = (current as MessageTree)[part]
  }
  return typeof current === 'string' ? current : key
}

export function translate(
  lang: AppLanguage,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = resolve(messages[lang], key)
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
    }
  }
  return text
}

export function t(lang: AppLanguage, key: string, params?: Record<string, string | number>): string {
  return translate(lang, key, params)
}

export function uvRiskLabelForLang(lang: AppLanguage, uv: number): string {
  if (uv <= 2) return t(lang, 'uvRisk.low')
  if (uv <= 5) return t(lang, 'uvRisk.moderate')
  if (uv <= 7) return t(lang, 'uvRisk.high')
  if (uv <= 10) return t(lang, 'uvRisk.veryHigh')
  return t(lang, 'uvRisk.extreme')
}

export function skinTypeLabel(lang: AppLanguage, type: SkinType): string {
  return t(lang, `skinType.${type}`)
}

export function activityLabel(lang: AppLanguage, mode: ActivityMode): string {
  return t(lang, `activity.${mode}`)
}

export function timerPhaseLabelForLang(lang: AppLanguage, phase: TimerPhase): string {
  const keys: Record<TimerPhase, string> = {
    idle: 'timerPhase.idle',
    protected: 'timerPhase.protected',
    'due-soon': 'timerPhase.dueSoon',
    'reapply-now': 'timerPhase.reapplyNow',
    overdue: 'timerPhase.overdue',
  }
  return t(lang, keys[phase])
}

export function formatDurationForLang(lang: AppLanguage, minutes: number): string {
  if (minutes < 60) return t(lang, 'duration.minutes', { n: minutes })
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? t(lang, 'duration.hours', { h }) : t(lang, 'duration.hoursMinutes', { h, m })
}

export function recommendationBadge(lang: AppLanguage, recommendation: DailyRecommendation): string {
  const keys: Record<DailyRecommendation, string> = {
    'take-sunscreen': 'home.takeSunscreenBadge',
    'fine-without': 'home.fineWithoutBadge',
    'maybe-later': 'home.maybeLaterBadge',
  }
  return t(lang, keys[recommendation])
}

export function recommendationTextFromForecast(
  lang: AppLanguage,
  maxEffectiveUv: number,
  hourlyEffective: number[],
): string {
  const highHours = hourlyEffective.filter((uv) => uv >= 3).length

  if (maxEffectiveUv < 3) return t(lang, 'recommendation.fineWithout')
  if (maxEffectiveUv >= 6 || highHours >= 4) return t(lang, 'recommendation.takeStrong')
  if (highHours >= 1 && maxEffectiveUv < 6) return t(lang, 'recommendation.maybeLater')
  return t(lang, 'recommendation.takeOutside')
}

export function getDepartureAlertCopyForLang(
  lang: AppLanguage,
  input: DepartureAlertInput,
): { title: string; body: string } | null {
  const { maxUv, hasActiveProtection, minutesLeft } = input

  if (maxUv < 3) return null

  if (hasActiveProtection && minutesLeft > 0) {
    return {
      title: t(lang, 'departure.leftHome'),
      body: t(lang, 'departure.timerActive', { minutes: minutesLeft }),
    }
  }

  const risk = uvRiskLabelForLang(lang, maxUv).toLowerCase()

  if (maxUv >= 6) {
    return {
      title: t(lang, 'departure.headedOut'),
      body: t(lang, 'departure.highUv', { risk, uv: maxUv }),
    }
  }

  return {
    title: t(lang, 'departure.headedOut'),
    body: t(lang, 'departure.moderateUv', { risk, uv: maxUv }),
  }
}

export function geolocationErrorMessageForLang(lang: AppLanguage, error: unknown): string {
  if (typeof GeolocationPositionError !== 'undefined' && error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return t(lang, 'geoError.permissionDenied')
      case error.POSITION_UNAVAILABLE:
        return t(lang, 'geoError.unavailable')
      case error.TIMEOUT:
        return t(lang, 'geoError.timeout')
      default:
        break
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('not supported')) {
      return t(lang, 'geoError.notSupported')
    }
    return error.message
  }

  return t(lang, 'geoError.generic')
}

export function insecureContextMessageForLang(lang: AppLanguage): string {
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost'
  return t(lang, 'geoError.insecure', { host })
}

export function getLocationSettingsGuideForLang(lang: AppLanguage): LocationSettingsGuide {
  const useCurrent = t(lang, 'geoGuide.useCurrent')

  if (isIosDevice() && isStandalonePwa()) {
    return {
      platform: 'ios-pwa',
      title: t(lang, 'geoGuide.iosPwaTitle'),
      primaryActionLabel: t(lang, 'geoGuide.openIphoneSettings'),
      secondaryActionLabel: useCurrent,
      steps:
        lang === 'nl'
          ? [
              'Tik hieronder op "Open iPhone-instellingen"',
              'Scroll naar UVision in de app-lijst',
              'Tik Locatie → kies "Tijdens gebruik van app"',
              'Ga terug naar UVision en tik "Gebruik mijn huidige locatie"',
            ]
          : [
              'Tap "Open iPhone Settings" below',
              'Scroll to UVision in the app list',
              'Tap Location → choose "While Using the App"',
              'Return to UVision and tap "Use my current location"',
            ],
    }
  }

  if (isIosDevice()) {
    return {
      platform: 'ios-safari',
      title: t(lang, 'geoGuide.iosSafariTitle'),
      primaryActionLabel: t(lang, 'geoGuide.openIphoneSettings'),
      secondaryActionLabel: useCurrent,
      steps:
        lang === 'nl'
          ? [
              'Tik in Safari op het icoon links van de adresbalk (Aa of schuifregelaars)',
              'Tik "Website-instellingen"',
              'Tik Locatie → kies "Sta toe" (niet "Weiger" of "Vraag")',
              'Ga terug naar deze pagina en tik hieronder "Gebruik mijn huidige locatie"',
            ]
          : [
              'In Safari, tap the icon to the left of the address bar (Aa or sliders icon)',
              'Tap "Website Settings" (or "Settings for This Website")',
              'Tap Location → choose "Allow" (not "Deny" or "Ask")',
              'Return to this page and tap "Use my current location" below',
            ],
    }
  }

  if (isAndroidDevice()) {
    return {
      platform: 'android',
      title: t(lang, 'geoGuide.androidTitle'),
      primaryActionLabel: t(lang, 'geoGuide.openPhoneSettings'),
      secondaryActionLabel: useCurrent,
      steps:
        lang === 'nl'
          ? [
              'Tik op het sloticoon naast het website-adres',
              'Open Machtigingen → Locatie → Toestaan',
              'Ga terug naar UVision en tik "Gebruik mijn huidige locatie"',
            ]
          : [
              'Tap the lock icon next to the website address',
              'Open Permissions → Location → Allow',
              'Return to UVision and tap "Use my current location"',
            ],
    }
  }

  return {
    platform: 'other',
    title: t(lang, 'geoGuide.otherTitle'),
    primaryActionLabel: t(lang, 'geoGuide.openBrowserSettings'),
    secondaryActionLabel: useCurrent,
    steps:
      lang === 'nl'
        ? [
            'Open je browserinstellingen voor deze site',
            'Zoek Locatiemachtigingen en zet op Toestaan',
            'Ga terug en tik "Gebruik mijn huidige locatie"',
          ]
        : [
            'Open your browser settings for this site',
            'Find Location permissions and set to Allow',
            'Return here and tap "Use my current location"',
          ],
  }
}

export interface EducationArticle {
  id: string
  title: string
  body: string
}

export function getEducationArticles(lang: AppLanguage): EducationArticle[] {
  if (lang === 'nl') {
    return [
      {
        id: 'spf-basics',
        title: 'Wat SPF echt betekent',
        body: 'SPF geeft aan hoeveel langer je in de zon kunt blijven zonder te verbranden, vergeleken met onbeschermde huid. SPF 30 blokkeert het meeste UVB — maar geen zonnebrand houdt de hele dag. Smeer elke 2 uur opnieuw, of eerder bij zwemmen of zweten.',
      },
      {
        id: 'peak-hours',
        title: 'Piekuren UV',
        body: 'UV is meestal het sterkst tussen 10:00 en 16:00. Zoek schaduw in deze uren, draag een hoed en smeer zonnebrand op blootgestelde huid — ook op bewolkte dagen.',
      },
      {
        id: 'clouds',
        title: 'Wolken blokkeren niet alles',
        body: 'Tot 80% van UV kan door lichte bewolking. UVision past je risico aan op basis van bewolking, zodat je niet verrast wordt op grijze dagen.',
      },
      {
        id: 'swimming',
        title: 'Na zwemmen of zweten',
        body: 'Water en zweet breken zonnebrand sneller af. Kies de modus Zwemmen wanneer je smeert — UVision herinnert je dan eerder.',
      },
      {
        id: 'skin-types',
        title: 'Ken je huidtype',
        body: 'Lichte huid verbrandt sneller en heeft vaker opnieuw smeren nodig. UVision gebruikt de Fitzpatrick-schaal (types I–VI) voor persoonlijke herinneringen.',
      },
      {
        id: 'how-much',
        title: 'Hoeveel smeer je',
        body: 'Gebruik ongeveer een shotglas (30 ml) voor je hele lichaam, of een theelepel voor gezicht en hals. De meeste mensen smeeren veel te weinig — dat halveert de bescherming.',
      },
    ]
  }

  return [
    {
      id: 'spf-basics',
      title: 'What SPF really means',
      body: 'SPF tells you how much longer you can stay in the sun before burning, compared to unprotected skin. SPF 30 blocks most UVB rays — but no sunscreen lasts all day. Reapply every 2 hours, or sooner when swimming or sweating.',
    },
    {
      id: 'peak-hours',
      title: 'Peak UV hours',
      body: 'UV is usually strongest between 10 AM and 4 PM. Seek shade during these hours, wear a hat, and reapply sunscreen on exposed skin — even on cloudy days.',
    },
    {
      id: 'clouds',
      title: 'Clouds don’t block everything',
      body: 'Up to 80% of UV can pass through light cloud cover. UVision adjusts your risk based on cloud cover so you’re not caught off guard on overcast days.',
    },
    {
      id: 'swimming',
      title: 'After swimming or sweating',
      body: 'Water and sweat break down sunscreen faster. Switch to Swimming mode when you log application — UVision will remind you sooner.',
    },
    {
      id: 'skin-types',
      title: 'Know your skin type',
      body: 'Fair skin burns faster and needs more frequent reapplication. UVision uses the Fitzpatrick scale (types I–VI) to personalize your reminders.',
    },
    {
      id: 'how-much',
      title: 'How much to apply',
      body: 'Use about a shot glass (30 ml) for your full body, or a teaspoon for your face and neck. Most people apply far too little — which cuts protection in half.',
    },
  ]
}

export function formatTimeForLang(lang: AppLanguage, date: Date): string {
  return date.toLocaleTimeString(localeForLanguage(lang), { hour: 'numeric', minute: '2-digit' })
}

export function formatDateTimeForLang(lang: AppLanguage, date: Date): string {
  return date.toLocaleString(localeForLanguage(lang), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateShortForLang(lang: AppLanguage, date: Date): string {
  return date.toLocaleDateString(localeForLanguage(lang), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTimeInZoneForLang(lang: AppLanguage, date: Date, timeZone: string): string {
  return date.toLocaleTimeString(localeForLanguage(lang), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
}

export function formatDateInZoneForLang(lang: AppLanguage, date: Date, timeZone: string): string {
  return date.toLocaleDateString(localeForLanguage(lang), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  })
}
