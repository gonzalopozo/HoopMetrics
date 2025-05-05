import Link from "next/link"
import Image from "next/image"
import { Search, Bell } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function Navbar({ searchValue, onSearchChange }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/HoopMetrics_dark.png"
            alt="NBA Metrics Logo"
            width={200}
            height={100}
            className="rounded-md"
          />
        </Link>
      </div>

      <div className="relative mx-4 flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Busca tu jugador favorito..." 
          className="w-full pl-8"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            3
          </span>
        </Button>
        <Avatar>
          <AvatarImage src="/fotillo.png" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  )
}