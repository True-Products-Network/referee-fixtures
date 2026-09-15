"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  XCircle,
  Users,
  Shirt,
  DollarSign,
  ChevronLeft,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function formatKickoffTime(kickoff: string) {
  const date = new Date(kickoff)
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`
  } else if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`
  }
  return format(date, "EEE, MMM d at h:mm a")
}

export default function FixtureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [fixture, setFixture] = useState<Fixture | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFixture() {
      try {
        const res = await fetch(`/api/fixtures?id=${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setFixture(data.fixtures?.[0] || null)
        }
      } catch (err) {
        console.error('Failed to fetch fixture:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFixture()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!fixture) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-lg font-semibold mb-2">Fixture not found</h1>
        <p className="text-sm text-muted-foreground mb-4">This fixture may have been deleted or archived.</p>
        <Button onClick={() => router.push('/today')}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Today
        </Button>
      </div>
    )
  }

  const isCompleted = fixture.appointment_status === 'completed'
  const isCancelled = fixture.appointment_status === 'cancelled' || fixture.appointment_status === 'declined'
  const canComplete = !isCompleted && !isCancelled && isPast(new Date(fixture.kickoff_start))

  return (
    <div className="min-h-screen pb-8 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Fixture Details</h1>
          </div>
          <Badge variant={getStatusBadgeVariant(fixture.appointment_status)}>
            {fixture.appointment_status}
          </Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Match Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{fixture.source_name}</span>
              {fixture.competition && (
                <span className="text-xs text-muted-foreground">{fixture.competition}</span>
              )}
            </div>
            <CardTitle className="text-xl mt-2">
              {fixture.home_team} <span className="text-muted-foreground font-normal">v</span> {fixture.away_team}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{formatKickoffTime(fixture.kickoff_start)}</p>
                {fixture.expected_match_end && (
                  <p className="text-sm text-muted-foreground">
                    Ends {format(new Date(fixture.expected_match_end), "h:mm a")}
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <Navigation className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium capitalize">{fixture.role.replace('_', ' ')}</p>
                {fixture.age_group && (
                  <p className="text-sm text-muted-foreground">{fixture.age_group}</p>
                )}
              </div>
            </div>

            {/* Venue */}
            {fixture.venue_id && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Venue</p>
                  <p className="text-sm text-muted-foreground">{fixture.venue_id}</p>
                </div>
              </div>
            )}

            {/* Arrival */}
            {fixture.required_arrival_time && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Arrive by {format(new Date(fixture.required_arrival_time), "h:mm a")}</p>
                  {fixture.planned_departure_time && (
                    <p className="text-sm text-muted-foreground">
                      Leave at {format(new Date(fixture.planned_departure_time), "h:mm a")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Crew */}
            {fixture.crew_names && fixture.crew_names.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Crew</p>
                  {fixture.crew_names.map((name, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{name}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Assignor */}
            {fixture.assignor_name && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Assignor</p>
                  <p className="text-sm">{fixture.assignor_name}</p>
                  {fixture.assignor_contact && (
                    <p className="text-sm text-muted-foreground">{fixture.assignor_contact}</p>
                  )}
                </div>
              </div>
            )}

            {/* Uniform */}
            {fixture.uniform_instructions && (
              <div className="flex items-start gap-3">
                <Shirt className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Uniform</p>
                  <p className="text-sm text-muted-foreground">{fixture.uniform_instructions}</p>
                </div>
              </div>
            )}

            {/* Financial */}
            {fixture.expected_gross_amount && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Payment</p>
                  <p className="text-sm">
                    ${fixture.expected_gross_amount.toFixed(2)} expected
                  </p>
                  {fixture.expected_match_fee && (
                    <p className="text-xs text-muted-foreground">
                      Match fee: ${fixture.expected_match_fee.toFixed(2)}
                      {fixture.travel_fee && ` + Travel: $${fixture.travel_fee.toFixed(2)}`}
                    </p>
                  )}
                  <Badge variant={fixture.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1 text-[10px]">
                    {fixture.payment_status}
                  </Badge>
                </div>
              </div>
            )}

            {/* Notes */}
            {fixture.fixture_notes && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{fixture.fixture_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" size="lg">
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
          {canComplete && (
            <Button variant="outline" className="flex-1" size="lg">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
