"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Bell, Mail, MessageSquare, Calendar, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface NotificationSetting {
  id: string
  title: string
  description: string
  push_enabled: boolean
  email_enabled: boolean
  icon: string
}

const ICONS: Record<string, React.ReactNode> = {
  calendar: <Calendar className="w-5 h-5" />,
  bell: <Bell className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    id: "new_fixture",
    title: "New Fixture Assigned",
    description: "When a new game is added to your schedule",
    push_enabled: true,
    email_enabled: true,
    icon: "calendar",
  },
  {
    id: "fixture_change",
    title: "Fixture Changes",
    description: "Time, venue, or crew changes",
    push_enabled: true,
    email_enabled: true,
    icon: "bell",
  },
  {
    id: "reminder",
    title: "Pre-Match Reminders",
    description: "Departure and arrival reminders",
    push_enabled: true,
    email_enabled: false,
    icon: "message",
  },
  {
    id: "payment",
    title: "Payment Updates",
    description: "When fees are paid or expected",
    push_enabled: false,
    email_enabled: true,
    icon: "mail",
  },
]

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings && data.settings.length > 0) {
          setSettings(data.settings)
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setSaveStatus('idle')
      setSaveError('')

      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (res.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const data = await res.json()
        setSaveStatus('error')
        setSaveError(data.error || 'Failed to save')
      }
    } catch (err) {
      console.error('Failed to save:', err)
      setSaveStatus('error')
      setSaveError('Network error')
    } finally {
      setSaving(false)
    }
  }

  function togglePush(id: string) {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, push_enabled: !s.push_enabled } : s
    ))
  }

  function toggleEmail(id: string) {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, email_enabled: !s.email_enabled } : s
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
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
                  {ICONS[setting.icon] || <Bell className="w-5 h-5" />}
                </div>
                <div>
                  <CardTitle className="text-base">{setting.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Push Toggle */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => togglePush(setting.id)}
              >
                <Label className="text-sm cursor-pointer">Push notifications</Label>
                <div className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${setting.push_enabled ? 'bg-primary' : 'bg-input'}
                `}>
                  <span className={`
                    inline-block h-4 w-4 transform rounded-full bg-background transition-transform
                    ${setting.push_enabled ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </div>
              </div>

              {/* Email Toggle */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleEmail(setting.id)}
              >
                <Label className="text-sm cursor-pointer">Email notifications</Label>
                <div className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${setting.email_enabled ? 'bg-primary' : 'bg-input'}
                `}>
                  <span className={`
                    inline-block h-4 w-4 transform rounded-full bg-background transition-transform
                    ${setting.email_enabled ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Preferences saved
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {saveError || 'Failed to save'}
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </main>
    </div>
  )
}
