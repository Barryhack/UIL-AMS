import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface NavbarProps {
  title: string
}

export function Navbar({ title }: NavbarProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-4 flex-1">
          <Image
            src="/images/unilorin-logo.png"
            alt="UNILORIN Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-center">
          <div className="relative w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex-1" />
      </div>
    </div>
  )
} 