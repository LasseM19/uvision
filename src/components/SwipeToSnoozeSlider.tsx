import { useRef, useState, type PointerEvent } from 'react'
import { useI18n } from '../hooks/useI18n'
import { REAPPLY_SNOOZE_MINUTES } from '../lib/sunscreenTimer'

const COMPLETE_THRESHOLD = 0.82

interface SwipeToSnoozeSliderProps {
  onSnooze: () => void
}

export function SwipeToSnoozeSlider({ onSnooze }: SwipeToSnoozeSliderProps) {
  const { t } = useI18n()
  const trackRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startProgress = useRef(0)
  const progressRef = useRef(0)
  const draggingRef = useRef(false)

  function setProgressClamped(value: number) {
    const next = Math.min(1, Math.max(0, value))
    progressRef.current = next
    setProgress(next)
  }

  function completeSnooze() {
    onSnooze()
    setProgressClamped(0)
    setDragging(false)
    draggingRef.current = false
  }

  function finishDrag() {
    setDragging(false)
    draggingRef.current = false

    if (progressRef.current >= COMPLETE_THRESHOLD) {
      completeSnooze()
      return
    }

    setProgressClamped(0)
  }

  function pointerPosition(event: PointerEvent<HTMLDivElement>): number {
    return event.clientX
  }

  function updateFromPointer(clientX: number) {
    const track = trackRef.current
    if (!track) return

    const rect = track.getBoundingClientRect()
    const handleWidth = 52
    const maxTravel = Math.max(rect.width - handleWidth - 8, 1)
    const delta = clientX - startX.current
    const next = startProgress.current + delta / maxTravel
    setProgressClamped(next)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    startX.current = pointerPosition(event)
    startProgress.current = progressRef.current
    draggingRef.current = true
    setDragging(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    updateFromPointer(pointerPosition(event))
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    finishDrag()
  }

  return (
    <div className="snooze-slider">
      <p className="snooze-slider__hint">
        {t('alarm.swipeSnooze', { minutes: REAPPLY_SNOOZE_MINUTES })}
      </p>
      <div ref={trackRef} className="snooze-slider__track">
        <div className="snooze-slider__fill" style={{ width: `calc(3.25rem + (100% - 3.25rem) * ${progress})` }} />
        <span className="snooze-slider__label">
          {t('alarm.snooze', { minutes: REAPPLY_SNOOZE_MINUTES })}
        </span>
        <div
          className={`snooze-slider__handle${dragging ? ' snooze-slider__handle--dragging' : ''}`}
          style={{ left: `calc(0.25rem + (100% - 3.25rem - 0.5rem) * ${progress})` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={t('alarm.snoozeAria', { minutes: REAPPLY_SNOOZE_MINUTES })}
        >
          <span aria-hidden>››</span>
        </div>
      </div>
    </div>
  )
}
