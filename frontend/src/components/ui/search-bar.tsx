import { Search } from "lucide-react"

export function SearchBar() {
    return (
        <div className="relative mx-2 flex-1 max-w-md md:max-w-2xl md:mx-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search players, teams, or stats..."
                    className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>
        </div>
    )
}
