"use client"

import { useState, useEffect } from "react"
import { format, differenceInMinutes, isPast, isToday, isTomorrow } from "date-fns"
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
  Calendar
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import type { Fixture, TodayView } from "@/types"

// Mock data for initial development
const mockFixtures: Fixture[] = [
  {
    id: "1",
    tenant_id: "1",
    user_id: "1",
    source_name: "Assignr",
    source_organisation: "Youth League",
    home_team: "Red Dragons FC",
    away_team: "Blue Eagles United",
    sport: "soccer",
    competition: "U14 Division A",
    age_group: "U14",
    role: "referee",
    appointment_status: "confirmed",
    payment_status: "expected",
    kickoff_start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    expected_match_end: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
    required_arrival_time: new Date(Date.now() + 1.25 * 60 * 60 * 1000).toISOString(),
    planned_departure_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    venue_id: "1",
    expected_match_fee: 65.00,
    travel_fee: 10.00,
    expected_gross_amount: 75.00,
    timezone: "America/New_York",
    pre_match_buffer_minutes: 0,
    post_match_buffer_minutes: 15,
    crew_names: ["John Smith - AR1", "Mike Johnson - AR2"],
    assignor_name: "Sarah Williams",
    assignor_contact: "sarah@youthleague.com",
    uniform_instructions: "Black shirt, black shorts, black socks",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    tenant_id: "1",
    user_id: "1",
    source_name: "Arbiter",
    source_organisation: "High School League",
    home_team: "Westside High",
    away_team: "Eastview Academy",
    sport: "soccer",
    competition: "Varsity Boys",
    age_group: "U18",
    role: "referee",
    appointment_status: "accepted",
    payment_status: "expected",
    kickoff_start: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow
    expected_match_end: new Date(Date.now() + 27.5 * 60 * 60 * 1000).toISOString(),
    required_arrival_time: new Date(Date.now() + 25.25 * 60 * 60 * 1000).toISOString(),
    venue_id: "2",
    expected_match_fee: 85.00,
    travel_fee: 15.00,
    expected_gross_amount: 100.00,
    timezone: "America/New_York",
    pre_match_buffer_minutes: 0,
    post_match_buffer_minutes: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

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
  const [nextFixture, setNextFixture] = useState<Fixture | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [travelWarning, setTravelWarning] = useState<string | null>(null)

  useEffect(() => {
    // Find the next fixture
    const now = new Date()
    const upcoming = mockFixtures
      .filter(f => !isPast(new Date(f.kickoff_start)) && f.appointment_status !== 'cancelled' && f.appointment_status !== 'declined')
      .sort((a, b) => new Date(a.kickoff_start).getTime() - new Date(b.kickoff_start).getTime())[0]
    
    setNextFixture(upcoming || null)

    if (upcoming?.planned_departure_time) {
      const departure = new Date(upcoming.planned_departure_time)
      const mins = differenceInMinutes(departure, now)
      setCountdown(mins > 0 ? mins : 0)
      
      if (mins < 30 && mins > 0) {
        setTravelWarning("Leave soon to arrive on time")
      } else if (mins <= 0) {
        setTravelWarning("You should have left already!")
      }
    }
  }, [])

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

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Today</h1>
          <span className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMM d")}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {nextFixture ? (
          <>
            {/* Countdown Card */}
            <Card className={countdown !== null && countdown < 30 ? "border-amber-500" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Next departure</p>
                    <p className="text-3xl font-bold">
                      {countdown !== null ? `${countdown} min` : "--"}
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
            <Card>
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
                  <Button className="flex-1" size="sm">
                    <Navigation className="w-4 h-4 mr-1" />
                    Directions
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Fixtures */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Upcoming
              </h2>
              {mockFixtures
                .filter(f => f.id !== nextFixture.id)
                .map(fixture => (
                  <Card key={fixture.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
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
                ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No upcoming fixtures</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You have no confirmed or accepted fixtures coming up.
            </p>
            <Button asChild>
              <Link href="/check">Check a New Offer</Link>
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}


