import type { LucideIcon } from "lucide-react"

interface CardHeaderProps {
    title: string
    icon: LucideIcon
}

export function CardHeader({ title, icon: Icon }: CardHeaderProps) {
    return (
        <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-bold text-foreground">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </h2>
        </div>
    )
}
