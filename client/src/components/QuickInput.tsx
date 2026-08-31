import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { api } from '../api'
import { formatRp } from '../utils'
import { Button } from './Button'

export function QuickInput() {
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.transactions.parse>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const parseMutation = useMutation({
    mutationFn: () => api.transactions.parse(text),
    onSuccess: (data) => {
      setPreview(data)
      setError(null)
    },
    onError: (e) => {
      setError((e as Error).message)
      setPreview(null)
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.transactions.quick(text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      setText('')
      setPreview(null)
      setError(null)
      inputRef.current?.focus()
    },
    onError: (e) => setError((e as Error).message),
  })

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (preview) saveMutation.mutate()
      else parseMutation.mutate()
    }
    if (e.key === 'Escape') {
      setPreview(null)
      setError(null)
    }
  }

  return (
    <div className="border-b border-[#DADAD6] bg-[#FFFFFF] px-6 py-2.5 flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <span className="text-[#8B8D92] text-[11px] font-mono shrink-0 uppercase tracking-wider">
          Quick
        </span>
        <input
          ref={inputRef}
          className="flex-1 bg-[#ECECE9] border border-[#DADAD6] rounded-[6px] px-3 py-1.5 text-xs text-[#1B1C1F] placeholder:text-[#8B8D92] focus:outline-none focus:border-[#2C2E33] focus:ring-1 focus:ring-[#2C2E33]"
          placeholder='Ketik cepat... mis. "Nasi goreng 15rb mandiri" lalu Enter'
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setPreview(null)
            setError(null)
          }}
          onKeyDown={handleKey}
        />
        <Button
          variant="secondary"
          onClick={() => parseMutation.mutate()}
          disabled={!text.trim() || parseMutation.isPending}
        >
          {parseMutation.isPending ? '...' : 'Preview'}
        </Button>
        {preview && (
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        )}
      </div>

      {preview && (
        <div className="flex gap-3 text-xs px-1 items-center flex-wrap">
          {preview.confidence === 'low' && (
            <span className="bg-[#F1E7D6] text-[#A9782E] px-1.5 py-0.5 rounded-[4px] font-medium text-[11px]">
              Perlu review
            </span>
          )}
          {preview.amount && (
            <span className="text-[#1B1C1F] tabular-nums font-semibold">
              {formatRp(preview.amount)}
            </span>
          )}
          {preview.category_name && (
            <span className="text-[#5A5C61] bg-[#ECECE9] px-2 py-0.5 rounded-[4px]">
              {preview.category_name}
            </span>
          )}
          {preview.payment_method_name && (
            <span className="text-[#5A5C61] bg-[#ECECE9] px-2 py-0.5 rounded-[4px]">
              {preview.payment_method_name}
            </span>
          )}
          {preview.description && (
            <span className="text-[#8B8D92] italic">"{preview.description}"</span>
          )}
          <span className="text-[#8B8D92] ml-auto text-[11px]">
            Enter: Simpan · Esc: Batal
          </span>
        </div>
      )}

      {error && <p className="text-xs text-[#B23A3A] px-1">{error}</p>}
    </div>
  )
}