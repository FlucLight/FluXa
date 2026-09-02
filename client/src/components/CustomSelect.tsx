import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: string
  badgeColor?: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  searchable?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  className = '',
  disabled = false,
  searchable = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [search, setSearch] = useState('')
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const trigger = containerRef.current?.getBoundingClientRect()
      if (!trigger) return

      const width = Math.min(Math.max(trigger.width, 200), window.innerWidth - 16)
      const estimatedHeight = Math.min(searchable ? 280 : 240, window.innerHeight - 16)
      const spaceBelow = window.innerHeight - trigger.bottom
      const shouldOpenUpwards = spaceBelow < estimatedHeight && trigger.top > estimatedHeight
      const left = Math.min(Math.max(8, trigger.left), window.innerWidth - width - 8)

      setOpenUpwards(shouldOpenUpwards)
      setMenuStyle({
        left,
        width,
        maxHeight: estimatedHeight,
        ...(shouldOpenUpwards
          ? { bottom: window.innerHeight - trigger.top + 6 }
          : { top: trigger.bottom + 6 }),
      })
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
      setSearch('')
    }

    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    if (searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, searchable, options.length])

  const filteredOptions = searchable && search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.badge && o.badge.toLowerCase().includes(search.toLowerCase()))
      )
    : options

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-xs rounded-[6px] transition-all bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] text-[var(--color-ink)] shadow-xs hover:bg-[var(--color-surface-sunken)] hover:border-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
          isOpen ? 'ring-1 ring-[var(--color-focus)] border-[var(--color-border-strong)]' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-[var(--color-ink-muted)]">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate font-medium ${!selectedOption ? 'text-[var(--color-ink-faint)]' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              className={`shrink-0 text-[9px] px-1.5 py-0.2 rounded-[3px] font-semibold uppercase tracking-wider ${
                selectedOption.badgeColor ?? 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border border-[var(--color-border)]'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[var(--color-ink)]' : ''
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && menuStyle.left !== undefined && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={menuStyle}
          className={`fixed z-[9999] min-w-[200px] overflow-y-auto bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] rounded-[8px] shadow-2xl p-1 animate-dropdown-in ${
            openUpwards ? 'origin-bottom' : 'origin-top'
          }`}
        >
          {searchable && (
            <div className="p-1.5 mb-1 border-b border-[var(--color-border)]">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari opsi..."
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[5px] px-2 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--color-ink-faint)] text-center">
                Tidak ada opsi cocok
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-[5px] text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)] font-semibold'
                        : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2 truncate">
                      {opt.icon && (
                        <span className={`shrink-0 ${isSelected ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
                          {opt.icon}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-[3px] font-semibold uppercase tracking-wider ${
                            opt.badgeColor ?? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] border border-[var(--color-border)]'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[var(--color-ink)] shrink-0"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}