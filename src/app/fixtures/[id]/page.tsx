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
  Edit3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  const [completing, setCompleting] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [paidAmount, setPaidAmount] = useState<string>("")
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [paymentMethod, setPaymentMethod] = useState<string>("")

  useEffect(() => {
    async function fetchFixture() {
      try {
        const res = await fetch(`/api/fixtures?id=${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setFixture(data.fixture || null)
          if (data.fixture?.expected_gross_amount) {
            setPaidAmount(data.fixture.expected_gross_amount.toString())
          }
        }
      } catch (err) {
        console.error('Failed to fetch fixture:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFixture()
  }, [params.id])

  const handleComplete = async () => {
    if (!fixture) return
    setCompleting(true)
    try {
      const updates: any = {
        appointment_status: 'completed',
        payment_status: 'expected',
      }

      if (paidAmount) {
        updates.paid_amount = parseFloat(paidAmount)
      }
      if (paymentDate) {
        updates.payment_date = paymentDate
      }
      if (paymentMethod) {
        updates.payment_method = paymentMethod
      }

      const res = await fetch('/api/fixtures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fixture.id, ...updates }),
      })

      if (res.ok) {
        const data = await res.json()
        setFixture(data.fixture)
        setCompleteDialogOpen(false)
      }
    } catch (err) {
      console.error('Failed to complete fixture:', err)
    } finally {
      setCompleting(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!fixture) return
    try {
      const res = await fetch('/api/fixtures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fixture.id,
          payment_status: 'paid',
          paid_amount: paidAmount ? parseFloat(paidAmount) : fixture.expected_gross_amount,
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          payment_method: paymentMethod || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFixture(data.fixture)
      }
    } catch (err) {
      console.error('Failed to mark as paid:', err)
    }
  }

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
  const isPaid = fixture.payment_status === 'paid'

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
            {fixture.venue_name && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Venue</p>
                  <p className="text-sm text-muted-foreground">{fixture.venue_name}</p>
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
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isPaid ? 'default' : 'secondary'} className="text-[10px]">
                      {fixture.payment_status}
                    </Badge>
                    {fixture.paid_amount && (
                      <span className="text-xs text-green-600">${fixture.paid_amount.toFixed(2)} paid</span>
                    )}
                  </div>
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
          <Button
            className="flex-1"
            size="lg"
            onClick={() => {
              const destination = fixture.venue_name || `${fixture.home_team} vs ${fixture.away_team}`
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`, '_blank')
            }}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>

          {canComplete && (
            <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" size="lg">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Fixture</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Amount Paid ($)</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Input
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="Direct deposit, check, cash..."
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleComplete}
                    disabled={completing}
                  >
                    {completing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Mark as Completed
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isCompleted && !isPaid && (
            <Button variant="outline" className="flex-1" size="lg" onClick={handleMarkPaid}>
              <DollarSign className="w-4 h-4 mr-2" />
              Mark Paid
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
