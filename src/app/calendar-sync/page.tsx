"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Link2,
  Loader2,
  RefreshCw,
  Unlink,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

function CalendarSyncContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const success = searchParams?.get('success') || null
  const urlError = searchParams?.get('error') || null

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/google-calendar/status')
      if (res.ok) {
        const data = await res.json()
        setConnected(data.connected)
        if (data.expired) {
          setError('Connection expired. Please reconnect.')
        }
      }
    } catch (err) {
      console.error('Failed to check status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/google-calendar/auth')
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (err) {
      console.error('Failed to start auth:', err)
      setError('Failed to start Google authentication')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setSyncResult(null)
      const res = await fetch('/api/google-calendar/sync', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSyncResult(data)
      } else {
        const err = await res.json()
        setError(err.error || 'Sync failed')
      }
    } catch (err) {
      console.error('Sync failed:', err)
      setError('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    setConnected(false)
    setSyncResult(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/more')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Google Calendar</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Status Messages */}
        {success && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">Google Calendar connected successfully!</p>
            </CardContent>
          </Card>
        )}

        {(error || urlError) && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error || urlError}</p>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {connected ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-gray-400" />
                )}
                <div>
                  <p className="font-medium">
                    {connected ? 'Connected' : 'Not Connected'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {connected
                      ? 'Your fixtures sync to Google Calendar'
                      : 'Connect to sync fixtures automatically'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={connected ? 'default' : 'secondary'}>
                {connected ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {connected ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDisconnect}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleConnect}>
                <Link2 className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sync Results */}
        {syncResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sync Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {syncResult.synced} fixture{syncResult.synced !== 1 ? 's' : ''} processed
              </p>
              {syncResult.results?.map((result: any) => (
                <div
                  key={result.fixtureId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {result.action === 'created' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {result.action === 'updated' && <RefreshCw className="w-4 h-4 text-blue-500" />}
                    {result.action === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm">{result.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {result.fixtureId.slice(0, 8)}...
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                1
              </div>
              <p className="text-sm">Connect your Google Calendar account</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                2
              </div>
              <p className="text-sm">Fixtures sync automatically when added or updated</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                3
              </div>
              <p className="text-sm">Events include match details, venue, and fee</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                4
              </div>
              <p className="text-sm">Reminders set for 1 day and 2 hours before kickoff</p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground text-center">
          We only create and manage events for your fixtures. We never read your existing calendar events.
        </p>
      </main>
    </div>
  )
}

export default function CalendarSyncPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CalendarSyncContent />
    </Suspense>
  )
}
