"use client"

import Link from "next/link"
import { 
  Settings, 
  Link2, 
  FileUp, 
  HelpCircle, 
  Bell, 
  Shield, 
  ChevronRight,
  Database,
  Mail,
  MapPin
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BottomNav } from "@/components/bottom-nav"

const menuItems = [
  {
    section: "Connections",
    items: [
      { label: "Source Connections", href: "/sources", icon: Link2, description: "Manage fixture sources" },
      { label: "Google Calendar", href: "/calendar-sync", icon: MapPin, description: "Sync with Google Calendar" },
      { label: "Import Data", href: "/import", icon: FileUp, description: "CSV or manual import" },
    ]
  },
  {
    section: "Settings",
    items: [
      { label: "Profile & Travel", href: "/settings/profile", icon: Settings, description: "Home address, mileage rate" },
      { label: "Notifications", href: "/settings/notifications", icon: Bell, description: "Push, email preferences" },
      { label: "Arrival Rules", href: "/settings/rules", icon: Database, description: "Default times by competition" },
    ]
  },
  {
    section: "System",
    items: [
      { label: "Review Queue", href: "/review", icon: Mail, description: "Duplicates, low confidence" },
      { label: "Privacy & Security", href: "/privacy", icon: Shield, description: "Data, encryption, export" },
      { label: "Help & Support", href: "/help", icon: HelpCircle, description: "Documentation, contact" },
    ]
  }
]

export default function MorePage() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">More</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* User Profile Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">N</span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">Nigel Lear</h2>
                <p className="text-sm text-muted-foreground">Personal Plan</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings/profile">Edit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Sections */}
        {menuItems.map((section, idx) => (
          <div key={section.section}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {section.section}
            </h2>
            <Card>
              <CardContent className="p-0">
                {section.items.map((item, itemIdx) => (
                  <div key={item.href}>
                    <Link 
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    {itemIdx < section.items.length - 1 && (
                      <Separator className="ml-12" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            {idx < menuItems.length - 1 && <div className="h-2" />}
          </div>
        ))}

        {/* Version Info */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Referee Fixture Hub v0.1.0</p>
          <p>Built for Nigel Lear</p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
