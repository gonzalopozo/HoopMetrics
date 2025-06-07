"use client"

import { ReactNode } from "react"

interface AdminHeaderProps {
  title: string
  description: string
  children?: ReactNode
}

export function AdminHeader({ title, description, children }: AdminHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
