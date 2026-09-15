"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfDay, endOfDay } from "date-fns"
import { ChevronLeft, ChevronRight, Filter, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import type { Fixture } from "@/types"

function getStatusColor(status: string) {
  switch (status) {
    case 'offered': return 'bg-blue-400'
    case 'accepted': return 'bg-green-500'
    case 'confirmed': return 'bg-green-600'
    case 'change_pending': return 'bg-amber-500'
    case 'declined': return 'bg-gray-400'
    case 'completed': return 'bg-emerald-700'
    case 'cancelled': return 'bg-gray-300'
    default: return 'bg-gray-400'
  }
}

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

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [view, setView] = useState<'month' | 'agenda'>('month')
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFixtures = useCallback(async () => {
    try {
      const from = startOfMonth(currentMonth).toISOString()
      const to = endOfMonth(currentMonth).toISOString()
      const res = await fetch(`/api/fixtures?from=${from}&to=${to}`)
      if (res.ok) {
        const data = await res.json()
        setFixtures(data.fixtures || [])
      }
    } catch (err) {
      console.error('Failed to fetch fixtures:', err)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchFixtures()
  }, [fetchFixtures])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const fixturesForDate = (date: Date) => {
    return fixtures.filter(f => 
      isSameDay(new Date(f.kickoff_start), date)
    )
  }

  const selectedFixtures = selectedDate ? fixturesForDate(selectedDate) : []

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
          <h1 className="text-lg font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView(view === 'month' ? 'agenda' : 'month')}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {view === 'month' ? (
          <>
            {/* Calendar Grid */}
            <div className="px-4">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((day) => {
                  const dayFixtures = fixturesForDate(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const hasConflict = dayFixtures.some(f => f.conflict_status === 'tight' || f.conflict_status === 'unavailable')
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative
                        ${isToday(day) ? 'bg-primary/10 font-bold' : ''}
                        ${isSelected ? 'ring-2 ring-primary' : ''}
                        ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground' : ''}
                        hover:bg-accent transition-colors
                      `}
                    >
                      <span>{format(day, "d")}</span>
                      {dayFixtures.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayFixtures.slice(0, 3).map((f, i) => (
                            <div 
                              key={i} 
                              className={`w-1.5 h-1.5 rounded-full ${getStatusColor(f.appointment_status)}`}
                            />
                          ))}
                          {hasConflict && (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1 right-1" />
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Date Fixtures */}
            {selectedDate && (
              <div className="px-4 mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, "EEEE, MMM d")}
                </h3>
                {selectedFixtures.length > 0 ? (
                  selectedFixtures.map(fixture => (
                    <Link key={fixture.id} href={`/fixtures/${fixture.id}`}>
                      <Card className="cursor-pointer hover:bg-accent/50 transition-colors mb-2">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px]">{fixture.source_name}</Badge>
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(fixture.appointment_status)}`} />
                              </div>
                              <p className="font-medium">{fixture.home_team} v {fixture.away_team}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(fixture.kickoff_start), "h:mm a")} • {fixture.role}
                              </p>
                              {fixture.competition && (
                                <p className="text-xs text-muted-foreground">{fixture.competition}</p>
                              )}
                            </div>
                            {fixture.conflict_status && (
                              <Badge variant={fixture.conflict_status === 'tight' ? 'tight' : 'conflict'} className="text-[10px]">
                                {fixture.conflict_status}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fixtures on this date
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          /* Agenda View */
          <div className="px-4 space-y-2">
            {fixtures.length > 0 ? (
              fixtures.map(fixture => (
                <Link key={fixture.id} href={`/fixtures/${fixture.id}`}>
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors mb-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getStatusBadgeVariant(fixture.appointment_status)} className="text-[10px]">
                              {fixture.appointment_status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{fixture.source_name}</span>
                          </div>
                          <p className="font-medium">{fixture.home_team} v {fixture.away_team}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(fixture.kickoff_start), "EEE, MMM d at h:mm a")}
                          </p>
                          {fixture.competition && (
                            <p className="text-xs text-muted-foreground">{fixture.competition}</p>
                          )}
                        </div>
                        {fixture.expected_gross_amount && (
                          <span className="text-sm font-medium">${fixture.expected_gross_amount.toFixed(2)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No fixtures this month
              </p>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
