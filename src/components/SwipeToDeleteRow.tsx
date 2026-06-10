import { useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { useI18n } from '../hooks/useI18n'

const ACTION_WIDTH = 92
const OPEN_THRESHOLD = ACTION_WIDTH * 0.35
const DELETE_THRESHOLD = ACTION_WIDTH * 0.72

interface SwipeToDeleteRowProps {
  onDelete: () => void
  children: ReactNode
  className?: string
}

export function SwipeToDeleteRow({ onDelete, children, className = '' }: SwipeToDeleteRowProps) {
  const { t } = useI18n()
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startOffset = useRef(0)
  const offsetRef = useRef(0)
  const tracking = useRef(false)

  function clampOffset(value: number): number {
    return Math.min(0, Math.max(-ACTION_WIDTH, value))
  }

  function setOffsetClamped(value: number) {
    const next = clampOffset(value)
    offsetRef.current = next
    setOffset(next)
  }

  function finishDrag(currentOffset: number) {
    setDragging(false)
    tracking.current = false

    if (currentOffset <= -DELETE_THRESHOLD) {
      onDelete()
      return
    }

    if (currentOffset <= -OPEN_THRESHOLD) {
      setOffsetClamped(-ACTION_WIDTH)
      return
    }

    setOffsetClamped(0)
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    startX.current = event.touches[0].clientX
    startOffset.current = offsetRef.current
    tracking.current = true
    setDragging(true)
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (!tracking.current) return

    const delta = event.touches[0].clientX - startX.current
    if (delta < -4) {
      event.preventDefault()
    }

    setOffsetClamped(startOffset.current + delta)
  }

  function handleTouchEnd() {
    if (!tracking.current) return
    finishDrag(offsetRef.current)
  }

  return (
    <div className={`swipe-delete${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="swipe-delete__action"
        aria-label={t('common.delete')}
        onClick={onDelete}
      >
        {t('common.delete')}
      </button>
      <div
        className={`swipe-delete__panel${dragging ? ' swipe-delete__panel--dragging' : ''}`}
        style={{
          transform: `translateX(${offset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
