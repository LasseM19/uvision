import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { HourlyForecast } from '../types'
import { formatTimeInZone, isSameHourInZone } from '../lib/timezone'
import { WeatherIconDisplay } from './WeatherIcon'
import { uvRiskColor } from '../lib/uvLogic'

interface HourlyUvChartProps {
  hours: HourlyForecast[]
  timeZone: string
}

const HOUR_WIDTH = 56
const CHART_HEIGHT = 108
const CHART_PAD_X = 20
const CHART_PAD_TOP = 28

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i]
    const next = points[i + 1]
    const midX = (current.x + next.x) / 2
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

function chartY(uv: number, maxUv: number): number {
  const usable = CHART_HEIGHT - 12
  return CHART_PAD_TOP + usable - (uv / maxUv) * usable
}

function interpolateUvAt(nowMs: number, hours: HourlyForecast[]): number {
  if (hours.length === 0) return 0
  if (hours.length === 1) return hours[0].effectiveUv

  if (nowMs <= hours[0].time.getTime()) return hours[0].effectiveUv

  for (let i = 0; i < hours.length - 1; i += 1) {
    const start = hours[i].time.getTime()
    const end = hours[i + 1].time.getTime()
    if (nowMs >= start && nowMs <= end) {
      const fraction = (nowMs - start) / (end - start)
      return hours[i].effectiveUv + fraction * (hours[i + 1].effectiveUv - hours[i].effectiveUv)
    }
  }

  return hours[hours.length - 1].effectiveUv
}

function getNowPosition(nowMs: number, hours: HourlyForecast[]): number {
  if (hours.length === 0) return CHART_PAD_X

  const first = hours[0].time.getTime()
  const hourMs = 60 * 60 * 1000
  const lastEnd = hours[hours.length - 1].time.getTime() + hourMs

  if (nowMs <= first) return CHART_PAD_X
  if (nowMs >= lastEnd) {
    return CHART_PAD_X + (hours.length - 1) * HOUR_WIDTH + HOUR_WIDTH / 2
  }

  for (let i = 0; i < hours.length; i += 1) {
    const start = hours[i].time.getTime()
    const end = i < hours.length - 1 ? hours[i + 1].time.getTime() : start + hourMs
    if (nowMs >= start && nowMs < end) {
      const fraction = (nowMs - start) / (end - start)
      return CHART_PAD_X + i * HOUR_WIDTH + fraction * HOUR_WIDTH
    }
  }

  return CHART_PAD_X
}

function isSameHour(a: Date, b: Date, timeZone: string): boolean {
  return isSameHourInZone(a, b, timeZone)
}

export function HourlyUvChart({ hours, timeZone }: HourlyUvChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const now = new Date(nowMs)

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const maxUv = useMemo(() => {
    const peak = Math.max(...hours.map((hour) => hour.effectiveUv), 1)
    return Math.max(3, Math.ceil(peak))
  }, [hours])

  const contentWidth = CHART_PAD_X * 2 + Math.max(hours.length - 1, 0) * HOUR_WIDTH + HOUR_WIDTH / 2

  const points = useMemo(
    () =>
      hours.map((hour, index) => ({
        x: CHART_PAD_X + index * HOUR_WIDTH + HOUR_WIDTH / 2,
        y: chartY(hour.effectiveUv, maxUv),
      })),
    [hours, maxUv],
  )

  const linePath = useMemo(() => buildSmoothPath(points), [points])
  const areaPath = useMemo(() => {
    if (!linePath || points.length === 0) return ''
    const baseY = CHART_PAD_TOP + CHART_HEIGHT - 12
    const first = points[0]
    const last = points[points.length - 1]
    return `${linePath} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
  }, [linePath, points])

  const nowX = useMemo(() => getNowPosition(nowMs, hours), [nowMs, hours])
  const nowUv = useMemo(() => interpolateUvAt(nowMs, hours), [nowMs, hours])
  const nowY = chartY(nowUv, maxUv)

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const target = nowX - element.clientWidth / 2
    element.scrollLeft = Math.max(0, Math.min(target, element.scrollWidth - element.clientWidth))
  }, [nowX, hours.length])

  if (hours.length === 0) return null

  return (
    <div className="hourly-chart">
      <div ref={scrollRef} className="hourly-chart__scroll" aria-label="Hourly UV forecast chart">
        <div className="hourly-chart__track" style={{ width: contentWidth }}>
          <svg
            className="hourly-chart__svg"
            viewBox={`0 0 ${contentWidth} ${CHART_PAD_TOP + CHART_HEIGHT}`}
            width={contentWidth}
            height={CHART_PAD_TOP + CHART_HEIGHT}
            aria-hidden
          >
            <defs>
              <linearGradient id="hourly-uv-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-orange)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-orange)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[maxUv, maxUv * 0.66, maxUv * 0.33].map((level) => (
              <line
                key={level}
                x1={CHART_PAD_X}
                x2={contentWidth - CHART_PAD_X}
                y1={chartY(level, maxUv)}
                y2={chartY(level, maxUv)}
                className="hourly-chart__grid-line"
              />
            ))}

            <path d={areaPath} fill="url(#hourly-uv-fill)" />
            <path d={linePath} className="hourly-chart__line" />

            <line
              x1={nowX}
              x2={nowX}
              y1={CHART_PAD_TOP - 4}
              y2={CHART_PAD_TOP + CHART_HEIGHT - 8}
              className="hourly-chart__now-line"
            />
            <circle
              cx={nowX}
              cy={nowY}
              r={5}
              className="hourly-chart__now-dot"
              style={{ fill: uvRiskColor(nowUv), stroke: 'var(--color-white)' }}
            />
          </svg>

          <div
            className="hourly-chart__now-label"
            style={{ left: nowX, color: uvRiskColor(nowUv) }}
          >
            <span className="hourly-chart__now-time">
              Now · {formatTimeInZone(now, timeZone)}
            </span>
            <span className="hourly-chart__now-uv">UV {nowUv.toFixed(1)}</span>
          </div>

          <div className="hourly-chart__labels" style={{ width: contentWidth }}>
            {hours.map((hour) => {
              const isNow = isSameHour(hour.time, now, timeZone)
              return (
                <div
                  key={hour.time.toISOString()}
                  className={`hourly-chart__label${isNow ? ' hourly-chart__label--now' : ''}`}
                  style={{ width: HOUR_WIDTH }}
                >
                  <span className="hourly-chart__label-time">{formatTimeInZone(hour.time, timeZone)}</span>
                  <WeatherIconDisplay icon={hour.weatherIcon} size="sm" />
                  <span
                    className="hourly-chart__label-uv"
                    style={{ color: uvRiskColor(hour.effectiveUv) }}
                  >
                    {hour.effectiveUv}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
