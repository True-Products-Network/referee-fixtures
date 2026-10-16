"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format, differenceInMinutes, isPast, isToday, isTomorrow, addDays, startOfDay } from "date-fns"
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shirt,
  DollarSign,
  ChevronRight,
  Calendar,
  Loader2,
  RefreshCw,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import type { Fixture } from "@/types"

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'offered': return 'offered'
    case 'accepted': return 'accepted'
    case 'confirmed': return 'confirmed'
    case 'change_pending': return 'pending'
    case 'completed': return 'completed'
    case 'cancelled': return 'cancelled'
    case 'declined': return 'cancelled'
    default: return 'default'
  }
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "Now"
  
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`)
  
  return parts.join(" ")
}

function formatKickoffTime(kickoff: string) {
  const date = new Date(kickoff)
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`
  } else if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`
  }
  return format(date, "EEE, MMM d at h:mm a")
}

export default function TodayPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextFixture, setNextFixture] = useState<Fixture | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [travelWarning, setTravelWarning] = useState<string | null>(null)
  
  // Date range for upcoming fixtures
  const [rangeDays, setRangeDays] = useState<number>(30)
  const [dateRangeLabel, setDateRangeLabel] = useState<string>("Next 30 days")
  const [showRangePicker, setShowRangePicker] = useState(false)

  const rangeOptions = [
    { label: "Today", days: 1 },
    { label: "Next 7 days", days: 7 },
    { label: "Next 30 days", days: 30 },
    { label: "Next 90 days", days: 90 },
    { label: "All future", days: 365 },
  ]

  const fetchFixtures = useCallback(async () => {
    try {
      setLoading(true)
      // Start from beginning of today so today's fixtures are included
      const from = startOfDay(new Date()).toISOString()
      const to = addDays(new Date(), rangeDays).toISOString()
      const res = await fetch(`/api/fixtures?from=${from}&to=${to}`)
      if (res.ok) {
        const data = await res.json()
        const loaded = data.fixtures || []
        setFixtures(loaded)

        // Find next fixture (first one that hasn't passed)
        const now = new Date()
        const upcoming = loaded
          .filter((f: Fixture) => {
            const kickoff = new Date(f.kickoff_start)
            return kickoff > now && f.appointment_status !== 'cancelled' && f.appointment_status !== 'declined'
          })
          .sort((a: Fixture, b: Fixture) => new Date(a.kickoff_start).getTime() - new Date(b.kickoff_start).getTime())[0]
        
        setNextFixture(upcoming || null)

        if (upcoming?.planned_departure_time) {
          const departure = new Date(upcoming.planned_departure_time)
          const mins = differenceInMinutes(departure, now)
          setCountdown(mins > 0 ? mins : 0)
          
          if (mins < 30 && mins > 0) {
            setTravelWarning("Leave soon to arrive on time")
          } else if (mins <= 0) {
            setTravelWarning("You should have left already!")
          } else {
            setTravelWarning(null)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch fixtures:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [rangeDays])

  useEffect(() => {
    fetchFixtures()
  }, [fetchFixtures])

  // Update countdown every minute
  useEffect(() => {
    if (!nextFixture?.planned_departure_time) return
    
    const interval = setInterval(() => {
      const now = new Date()
      const departure = new Date(nextFixture.planned_departure_time!)
      const mins = differenceInMinutes(departure, now)
      setCountdown(mins > 0 ? mins : 0)
    }, 60000)

    return () => clearInterval(interval)
  }, [nextFixture])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchFixtures()
  }

  const selectRange = (days: number, label: string) => {
    setRangeDays(days)
    setDateRangeLabel(label)
    setShowRangePicker(false)
  }

  if (loading && fixtures.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="app-layout bg-background">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Today</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <span className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMM d")}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-4 space-y-4">
        {/* Date Range Selector */}
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-between"
            onClick={() => setShowRangePicker(!showRangePicker)}
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {dateRangeLabel}
            </span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showRangePicker ? 'rotate-90' : ''}`} />
          </Button>
          
          {showRangePicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg z-50 py-1">
              {rangeOptions.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => selectRange(opt.days, opt.label)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    rangeDays === opt.days ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {nextFixture ? (
          <>
            {/* Countdown Card */}
            <Card className={countdown !== null && countdown < 30 ? "border-amber-500" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Next departure</p>
                    <p className="text-3xl font-bold">
                      {countdown !== null ? formatDuration(countdown) : "--"}
                    </p>
                  </div>
                  {travelWarning && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-medium">{travelWarning}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Next Fixture Card */}
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <Link href={`/fixtures/${nextFixture.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusBadgeVariant(nextFixture.appointment_status)}>
                      {nextFixture.appointment_status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {nextFixture.source_name}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">
                    {nextFixture.home_team} v {nextFixture.away_team}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatKickoffTime(nextFixture.kickoff_start)}</span>
                  </div>
                  
                  {nextFixture.required_arrival_time && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Arrive by {format(new Date(nextFixture.required_arrival_time), "h:mm a")}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                    <span className="capitalize">{nextFixture.role.replace('_', ' ')}</span>
                    {nextFixture.competition && (
                      <span className="text-muted-foreground">• {nextFixture.competition}</span>
                    )}
                  </div>

                  {nextFixture.expected_gross_amount && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>${nextFixture.expected_gross_amount.toFixed(2)} expected</span>
                    </div>
                  )}

                  {nextFixture.crew_names && nextFixture.crew_names.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{nextFixture.crew_names.join(", ")}</span>
                    </div>
                  )}

                  {nextFixture.uniform_instructions && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shirt className="w-4 h-4 text-muted-foreground" />
                      <span>{nextFixture.uniform_instructions}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" size="sm" onClick={(e) => e.preventDefault()}>
                      <Navigation className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm" onClick={(e) => e.preventDefault()}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>

            {/* Upcoming Fixtures */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Upcoming
                </h2>
                <span className="text-xs text-muted-foreground">
                  {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''}
                </span>
              </div>
              {fixtures
                .filter(f => f.id !== nextFixture.id)
                .map(fixture => (
                  <Link key={fixture.id} href={`/fixtures/${fixture.id}`}>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors mb-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getStatusBadgeVariant(fixture.appointment_status)} className="text-[10px]">
                                {fixture.appointment_status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{fixture.source_name}</span>
                            </div>
                            <p className="font-medium text-sm">
                              {fixture.home_team} v {fixture.away_team}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatKickoffTime(fixture.kickoff_start)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No upcoming fixtures</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You have no confirmed or accepted fixtures in {dateRangeLabel.toLowerCase()}.
            </p>
            <Button asChild>
              <Link href="/sources">Add a Source</Link>
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
