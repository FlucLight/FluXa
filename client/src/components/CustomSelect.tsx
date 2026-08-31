import React, { useEffect, useRef, useState } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      // Check available space below
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        if (spaceBelow < 240 && rect.top > 240) {
          setOpenUpwards(true)
        } else {
          setOpenUpwards(false)
        }
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, searchable])

  const filteredOptions = searchable && search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.badge && o.badge.toLowerCase().includes(search.toLowerCase()))
      )
    : options

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-xs rounded-[6px] transition-all bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
          isOpen ? 'ring-1 ring-[var(--color-focus)] border-[var(--color-border-strong)]' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
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
              className={`text-[9px] px-1.5 py-0.2 rounded-[3px] font-semibold uppercase tracking-wider ${
                selectedOption.badgeColor ?? 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border border-[var(--color-border)]'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        {/* Chevron Icon */}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-[999] w-full min-w-[200px] max-h-60 overflow-y-auto bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[8px] shadow-2xl p-1 animate-dropdown-in ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
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
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[5px] px-2 py-1 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
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
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`flex items-center justify-between gap-2 w-full px-2.5 py-1.5 rounded-[5px] text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)] font-semibold'
                        : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
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
        </div>
      )}
    </div>
  )
}