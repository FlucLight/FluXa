import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarIcon, CloseIcon } from './Icons'
import { toLocalDateInput } from '../utils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal...',
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date(`${toLocalDateInput()}T00:00:00`)
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth())

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const trigger = containerRef.current?.getBoundingClientRect()
      if (!trigger) return

      const width = Math.min(256, window.innerWidth - 24)
      const estimatedHeight = 290
      const spaceBelow = window.innerHeight - trigger.bottom
      const shouldOpenUpwards = spaceBelow < estimatedHeight && trigger.top > estimatedHeight
      const left = Math.min(Math.max(12, trigger.left), window.innerWidth - width - 12)

      setOpenUpwards(shouldOpenUpwards)
      setPopupStyle({
        left,
        width,
        ...(shouldOpenUpwards
          ? { bottom: window.innerHeight - trigger.top + 8 }
          : { top: trigger.bottom + 8 }),
      })
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target) || popupRef.current?.contains(target)) return
      setIsOpen(false)
    }

    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    const y = viewYear
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setIsOpen(false)
  }

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(toLocalDateInput())
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setIsOpen(false)
  }

  const formatDisplay = (val: string) => {
    if (!val) return ''
    const d = new Date(val + 'T00:00:00')
    if (isNaN(d.getTime())) return val
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  }

  const today = new Date(`${toLocalDateInput()}T00:00:00`)
  const isTodayMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth
  const todayDay = today.getDate()
  const selectedDayNum = value ? parseInt(value.split('-')[2] ?? '0', 10) : 0
  const isSelectedMonth = value ? (
    parseInt(value.split('-')[0] ?? '0', 10) === viewYear &&
    parseInt(value.split('-')[1] ?? '0', 10) - 1 === viewMonth
  ) : false

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-xs rounded-[6px] transition-all bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] cursor-pointer ${
          isOpen ? 'ring-1 ring-[var(--color-focus)] border-[var(--color-border-strong)]' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-2 truncate">
          <CalendarIcon size={13} className="text-[var(--color-ink-muted)] shrink-0" />
          <span className={`truncate font-medium ${!value ? 'text-[var(--color-ink-faint)]' : ''}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>

        {value ? (
          <span
            onClick={handleClear}
            className="text-[var(--color-ink-faint)] hover:text-[var(--color-negative)] p-0.5 rounded cursor-pointer transition-colors"
            title="Hapus tanggal"
          >
            <CloseIcon size={10} />
          </span>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {isOpen && popupStyle.left !== undefined && createPortal(
        <div
          ref={popupRef}
          style={popupStyle}
          className={`fixed z-[9999] max-h-[calc(100dvh-24px)] overflow-y-auto p-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] shadow-2xl animate-dropdown-in ${openUpwards ? 'origin-bottom' : 'origin-top'}`}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="p-1 rounded-[5px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <span className="text-xs font-bold text-[var(--color-ink)] font-display">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="p-1 rounded-[5px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-[var(--color-ink-faint)]">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <span key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1
              const isSelected = isSelectedMonth && selectedDayNum === day
              const isToday = isTodayMonth && todayDay === day

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 text-xs font-medium rounded-[6px] flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    isSelected
                      ? 'bg-[var(--color-ink)] text-[var(--color-surface-raised)] font-bold shadow-xs'
                      : isToday
                      ? 'border border-[var(--color-focus)] text-[var(--color-ink)] font-bold hover:bg-[var(--color-surface-sunken)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--color-border)] text-[11px]">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-medium cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  className = '',
}: DateTimePickerProps) {
  const datePart = value ? value.slice(0, 10) : toLocalDateInput()
  const timePart = value && value.length >= 16 ? value.slice(11, 16) : '12:00'

  const handleDateChange = (newDate: string) => {
    if (newDate) {
      onChange(`${newDate}T${timePart}`)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (datePart) {
      onChange(`${datePart}T${e.target.value}`)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="min-w-0 flex-1">
        <DatePicker value={datePart} onChange={handleDateChange} placeholder="Pilih tanggal" />
      </div>
      <div className="w-24 shrink-0">
        <input
          type="time"
          value={timePart}
          onChange={handleTimeChange}
          className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-2.5 py-2 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] font-mono font-medium"
        />
      </div>
    </div>
  )
}