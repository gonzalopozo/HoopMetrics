import Link from "next/link"
import { BarChart2 } from "lucide-react"

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BarChart2 className="h-6 w-6" />
            </div>
            <span className="hidden text-xl font-bold text-foreground md:block">HoopMetrics</span>
        </Link>
    )
}
