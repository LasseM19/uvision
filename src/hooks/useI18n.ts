import { useEffect, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import type { AppLanguage } from '../types'
import {
  activityLabel,
  formatDateInZoneForLang,
  formatDateShortForLang,
  formatDateTimeForLang,
  formatDurationForLang,
  formatTimeForLang,
  formatTimeInZoneForLang,
  getEducationArticles,
  getLocationSettingsGuideForLang,
  localeForLanguage,
  recommendationBadge,
  recommendationTextFromForecast,
  skinTypeLabel,
  timerPhaseLabelForLang,
  translate,
  uvRiskLabelForLang,
} from '../i18n'

export function useI18n() {
  const { preferences } = useAppContext()
  const lang: AppLanguage = preferences.language

  return useMemo(
    () => ({
      lang,
      locale: localeForLanguage(lang),
      t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
      uvRiskLabel: (uv: number) => uvRiskLabelForLang(lang, uv),
      skinTypeLabel: (type: Parameters<typeof skinTypeLabel>[1]) => skinTypeLabel(lang, type),
      activityLabel: (mode: Parameters<typeof activityLabel>[1]) => activityLabel(lang, mode),
      timerPhaseLabel: (phase: Parameters<typeof timerPhaseLabelForLang>[1]) =>
        timerPhaseLabelForLang(lang, phase),
      formatDuration: (minutes: number) => formatDurationForLang(lang, minutes),
      formatTime: (date: Date) => formatTimeForLang(lang, date),
      formatDateTime: (date: Date) => formatDateTimeForLang(lang, date),
      formatDateShort: (date: Date) => formatDateShortForLang(lang, date),
      formatTimeInZone: (date: Date, timeZone: string) => formatTimeInZoneForLang(lang, date, timeZone),
      formatDateInZone: (date: Date, timeZone: string) => formatDateInZoneForLang(lang, date, timeZone),
      recommendationBadge: (recommendation: Parameters<typeof recommendationBadge>[1]) =>
        recommendationBadge(lang, recommendation),
      recommendationTextFromForecast: (
        maxEffectiveUv: number,
        hourlyEffective: number[],
      ) => recommendationTextFromForecast(lang, maxEffectiveUv, hourlyEffective),
      educationArticles: getEducationArticles(lang),
      locationSettingsGuide: getLocationSettingsGuideForLang(lang),
    }),
    [lang],
  )
}

export function useDocumentLanguage() {
  const { preferences } = useAppContext()

  useEffect(() => {
    document.documentElement.lang = preferences.language
  }, [preferences.language])
}
