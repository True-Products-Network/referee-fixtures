"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Bell, Mail, MessageSquare, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface NotificationSetting {
  id: string
  title: string
  description: string
  push: boolean
  email: boolean
  icon: React.ReactNode
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "new_fixture",
      title: "New Fixture Assigned",
      description: "When a new game is added to your schedule",
      push: true,
      email: true,
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: "fixture_change",
      title: "Fixture Changes",
      description: "Time, venue, or crew changes",
      push: true,
      email: true,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "reminder",
      title: "Pre-Match Reminders",
      description: "Departure and arrival reminders",
      push: true,
      email: false,
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: "payment",
      title: "Payment Updates",
      description: "When fees are paid or expected",
      push: false,
      email: true,
      icon: <Mail className="w-5 h-5" />,
    },
  ])

  function toggleSetting(id: string, type: "push" | "email") {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, [type]: !s[type] } : s
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/more">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-bold">Notifications</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose how you want to be notified about your fixtures.
        </p>

        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {setting.icon}
                </div>
                <div>
                  <CardTitle className="text-base">{setting.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${setting.id}-push`} className="text-sm">Push notifications</Label>
                <Switch
                  id={`${setting.id}-push`}
                  checked={setting.push}
                  onCheckedChange={() => toggleSetting(setting.id, "push")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`${setting.id}-email`} className="text-sm">Email notifications</Label>
                <Switch
                  id={`${setting.id}-email`}
                  checked={setting.email}
                  onCheckedChange={() => toggleSetting(setting.id, "email")}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button className="w-full">
          Save Preferences
        </Button>
      </main>
    </div>
  )
}
