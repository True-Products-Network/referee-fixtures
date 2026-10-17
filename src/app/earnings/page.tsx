"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek, subMonths, subYears, isWithinInterval } from "date-fns"
import { DollarSign, TrendingUp, Receipt, Calendar, Loader2, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import type { Fixture } from "@/types"

interface EarningsSummary {
  totalExpected: number
  totalPaid: number
  totalUnpaid: number
  totalUpcoming: number
  fixtureCount: number
  completedCount: number
  paidCount: number
  unpaidCount: number
  upcomingCount: number
}

interface SourceStat {
  count: number
  expected: number
  paid: number
}

interface MonthlyData {
  expected: number
  paid: number
  count: number
}

export default function EarningsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [sourceStats, setSourceStats] = useState<Record<string, SourceStat>>({})
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<Record<string, MonthlyData>>({})
  const [loading, setLoading] = useState(true)

  const getDateRange = useCallback(() => {
    switch (period) {
      case 'week':
        return {
          from: startOfWeek(currentDate, { weekStartsOn: 0 }).toISOString(),
          to: endOfWeek(currentDate, { weekStartsOn: 0 }).toISOString(),
          label: format(currentDate, "MMM d, yyyy")
        }
      case 'month':
        return {
          from: startOfMonth(currentDate).toISOString(),
          to: endOfMonth(currentDate).toISOString(),
          label: format(currentDate, "MMMM yyyy")
        }
      case 'year':
        return {
          from: startOfYear(currentDate).toISOString(),
          to: endOfYear(currentDate).toISOString(),
          label: format(currentDate, "yyyy")
        }
      case 'all':
        return {
          from: null,
          to: null,
          label: 'All Time'
        }
    }
  }, [period, currentDate])

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true)
      const range = getDateRange()
      let url = '/api/earnings'
      const params = new URLSearchParams()
      if (range.from) params.append('from', range.from)
      if (range.to) params.append('to', range.to)
      params.append('period', period)
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setFixtures(data.fixtures || [])
        setSummary(data.summary)
        setSourceStats(data.sourceStats || {})
        setMonthlyBreakdown(data.monthlyBreakdown || {})
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err)
    } finally {
      setLoading(false)
    }
  }, [getDateRange, period])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (period === 'all') return
    const multiplier = direction === 'prev' ? -1 : 1
    if (period === 'week') {
      setCurrentDate(prev => new Date(prev.getTime() + multiplier * 7 * 24 * 60 * 60 * 1000))
    } else if (period === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + multiplier, 1))
    } else if (period === 'year') {
      setCurrentDate(prev => new Date(prev.getFullYear() + multiplier, 0, 1))
    }
  }

  const range = getDateRange()

  const completedFixtures = fixtures.filter(f => f.appointment_status === 'completed')
  const paidFixtures = completedFixtures.filter(f => f.payment_status === 'paid')
  const unpaidFixtures = completedFixtures.filter(f => f.payment_status === 'expected' || f.payment_status === 'overdue')
  const upcomingFixtures = fixtures.filter(f =>
    f.appointment_status !== 'completed' &&
    f.appointment_status !== 'cancelled' &&
    f.appointment_status !== 'declined'
  )

  const stats = [
    { label: "Expected", value: summary?.totalExpected || 0, icon: DollarSign, color: "text-blue-600" },
    { label: "Paid", value: summary?.totalPaid || 0, icon: TrendingUp, color: "text-green-600" },
    { label: "Unpaid", value: summary?.totalUnpaid || 0, icon: Receipt, color: "text-amber-600" },
  ]

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
          <h1 className="text-lg font-bold">Earnings</h1>
          <div className="flex items-center gap-1 bg-background rounded-lg px-2 py-1">
            {period !== 'all' && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigatePeriod('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <span className="text-sm text-muted-foreground min-w-[100px] text-center bg-background">{range.label}</span>
            {period !== 'all' && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigatePeriod('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Period Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              className="flex-1 capitalize"
              onClick={() => {
                setPeriod(p)
                setCurrentDate(new Date())
              }}
            >
              {p === 'all' ? 'All' : p}
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold">${stat.value.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Earnings Card */}
        {(summary?.totalUpcoming || 0) > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Upcoming Earnings</span>
                </div>
                <span className="font-bold text-blue-700">${(summary?.totalUpcoming || 0).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.upcomingCount || 0} fixture{summary?.upcomingCount !== 1 ? 's' : ''} pending
              </p>
            </CardContent>
          </Card>
        )}

        {/* Fixture Lists */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-2 mt-4">
            {upcomingFixtures.length > 0 ? (
              upcomingFixtures.map(fixture => (
                <Card key={fixture.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{fixture.home_team} v {fixture.away_team}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fixture.kickoff_start), "EEE, MMM d")} • {fixture.source_name}
                        </p>
                        {fixture.role && (
                          <p className="text-xs text-muted-foreground capitalize">{fixture.role.replace('_', ' ')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${fixture.expected_gross_amount?.toFixed(2) || '0.00'}</p>
                        <Badge variant="outline" className="text-[10px]">Expected</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming fixtures</p>
            )}
          </TabsContent>

          <TabsContent value="unpaid" className="space-y-2 mt-4">
            {unpaidFixtures.length > 0 ? (
              unpaidFixtures.map(fixture => (
                <Card key={fixture.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{fixture.home_team} v {fixture.away_team}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fixture.kickoff_start), "MMM d")} • {fixture.source_name}
                        </p>
                        {fixture.role && (
                          <p className="text-xs text-muted-foreground capitalize">{fixture.role.replace('_', ' ')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${fixture.expected_gross_amount?.toFixed(2) || '0.00'}</p>
                        <Badge variant="pending" className="text-[10px]">Unpaid</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No unpaid fixtures</p>
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-2 mt-4">
            {paidFixtures.length > 0 ? (
              paidFixtures.map(fixture => (
                <Card key={fixture.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{fixture.home_team} v {fixture.away_team}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fixture.kickoff_start), "MMM d")} • {fixture.source_name}
                        </p>
                        {fixture.role && (
                          <p className="text-xs text-muted-foreground capitalize">{fixture.role.replace('_', ' ')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${fixture.paid_amount?.toFixed(2) || fixture.expected_gross_amount?.toFixed(2) || '0.00'}</p>
                        <Badge variant="completed" className="text-[10px]">Paid</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No paid fixtures yet</p>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary by Source */}
        {Object.keys(sourceStats).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(sourceStats)
                .sort((a, b) => b[1].expected - a[1].expected)
                .map(([source, stat]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{source}</span>
                      <span className="text-xs text-muted-foreground ml-2">({stat.count})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">${stat.expected.toFixed(2)}</span>
                      {stat.paid > 0 && (
                        <span className="text-xs text-green-600 ml-2">${stat.paid.toFixed(2)} paid</span>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Monthly Breakdown (for year/all view) */}
        {period !== 'week' && Object.keys(monthlyBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(monthlyBreakdown)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm">{format(new Date(month + '-01'), "MMMM yyyy")}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">${data.expected.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({data.count})</span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
