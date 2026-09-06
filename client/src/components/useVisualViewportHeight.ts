import { useEffect, useState } from 'react'

export function useVisualViewportHeight(): number {
  const [height, setHeight] = useState(() => window.visualViewport?.height ?? window.innerHeight)

  useEffect(() => {
    const vv = window.visualViewport
    let frame = 0

    const apply = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setHeight(vv?.height ?? window.innerHeight)
      })
    }

    if (!vv) {
      window.addEventListener('resize', apply)
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', apply)
      }
    }

    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)

    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
    }
  }, [])

  return height
}