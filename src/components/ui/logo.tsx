'use client'

import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'light' | 'dark'
}

export function Logo({ className, variant }: LogoProps) {
  const darkMode = useAppStore((s) => s.darkMode)

  const isDark = variant === 'dark' || (variant === undefined && darkMode)
  const src = isDark ? '/logo-dark-mode.png' : '/logo-light-mode.png'

  return (
    <img
      src={src}
      alt="Dhayaro"
      width={28}
      height={28}
      className={cn('object-contain', className)}
    />
  )
}
