import { cn } from '@/utils'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}) {
  const variants = {
    primary: 'gradient-submit text-slate-900 font-semibold shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:brightness-110',
    secondary: 'bg-vc-card border border-vc-border text-vc-text hover:border-vc-primary/50',
    outline: 'border-2 border-vc-accent text-vc-accent bg-transparent hover:bg-vc-accent/10',
    ghost: 'text-vc-muted hover:text-vc-text hover:bg-white/5',
    accent: 'bg-vc-accent text-slate-900 font-semibold hover:brightness-110',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3.5 text-base rounded-xl',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-4 py-2.5 text-sm input-dark dark:bg-vc-bg bg-white border border-light-border dark:border-vc-border rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full px-4 py-3 text-sm input-dark min-h-[120px] resize-y',
        'dark:bg-vc-bg bg-white border border-light-border dark:border-vc-border rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full px-4 py-2.5 text-sm input-dark appearance-none cursor-pointer',
        'dark:bg-vc-bg bg-white border border-light-border dark:border-vc-border rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn('label-caps mb-1.5 block', className)}>{children}</label>
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 md:p-6',
        'dark:bg-vc-card dark:border-vc-border bg-white border-light-border shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string | number
  hint?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl px-4 py-4 border',
        'dark:bg-[#121820] dark:border-vc-border bg-slate-50 border-light-border',
        className,
      )}
    >
      <p className="label-caps mb-1.5 sm:mb-2 text-[0.65rem] sm:text-[0.7rem] leading-tight">{label}</p>
      <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight dark:text-white text-light-text">
        {value}
      </p>
      {hint ? <p className="text-xs text-vc-muted mt-1">{hint}</p> : null}
    </div>
  )
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PageTitle({ title, accent = true }: { title: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
      {accent ? <span className="w-1 h-6 sm:h-7 rounded-full bg-vc-accent shadow-[0_0_12px_var(--color-vc-accent-glow)] shrink-0" /> : null}
      <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold dark:text-white text-light-text">{title}</h1>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-vc-muted">
      <p>{message}</p>
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-8 w-8 rounded-full border-2 border-vc-teal/30 border-t-vc-teal animate-spin',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
