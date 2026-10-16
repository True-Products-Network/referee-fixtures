"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, AlertTriangle, CheckCircle2, MapPin, Clock, Users, Loader2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Fixture {
  id: string
  home_team: string
  away_team: string
  kickoff_start: string
  venue_name: string | null
  location: string | null
  role: string
  competition: string | null
  crew_names: string[] | null
  source_name: string
  appointment_status: string
}

interface ReviewIssue {
  id: string
  fixture_id: string
  type: "missing_venue" | "missing_time" | "unassigned_crew" | "duplicate" | "incomplete"
  severity: "warning" | "error"
  description: string
  fixture: Fixture
}

export default function ReviewQueuePage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [issues, setIssues] = useState<ReviewIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const fetchFixtures = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/fixtures?from=2026-01-01&to=2027-12-31')
      if (res.ok) {
        const data = await res.json()
        const loaded = data.fixtures || []
        setFixtures(loaded)
        analyzeIssues(loaded)
      }
    } catch (err) {
      console.error('Failed to fetch fixtures:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFixtures()
  }, [fetchFixtures])

  function analyzeIssues(fixtures: Fixture[]) {
    const found: ReviewIssue[] = []
    const seen = new Map<string, string>() // key -> fixture_id

    fixtures.forEach((fixture) => {
      // Check for missing venue
      if (!fixture.venue_name || fixture.venue_name === 'TBD') {
        found.push({
          id: `venue-${fixture.id}`,
          fixture_id: fixture.id,
          type: "missing_venue",
          severity: "error",
          description: `No venue assigned for ${fixture.home_team} vs ${fixture.away_team}`,
          fixture,
        })
      }

      // Check for unassigned crew
      if (!fixture.crew_names || fixture.crew_names.length === 0) {
        found.push({
          id: `crew-${fixture.id}`,
          fixture_id: fixture.id,
          type: "unassigned_crew",
          severity: "warning",
          description: `No crew members listed for this fixture`,
          fixture,
        })
      }

      // Check for duplicates (same teams, same time)
      const key = `${fixture.home_team}-${fixture.away_team}-${fixture.kickoff_start}`
      if (seen.has(key)) {
        found.push({
          id: `dup-${fixture.id}`,
          fixture_id: fixture.id,
          type: "duplicate",
          severity: "warning",
          description: `Possible duplicate: Same fixture exists multiple times`,
          fixture,
        })
      } else {
        seen.set(key, fixture.id)
      }

      // Check for incomplete data
      if (fixture.home_team === 'TBD' || fixture.away_team === 'TBD') {
        found.push({
          id: `incomplete-${fixture.id}`,
          fixture_id: fixture.id,
          type: "incomplete",
          severity: "warning",
          description: `Team information incomplete`,
          fixture,
        })
      }
    })

    setIssues(found)
  }

  function dismissIssue(id: string) {
    setDismissedIds(prev => [...prev, id])
  }

  function getSeverityColor(severity: string) {
    return severity === 'error' ? 'text-red-500' : 'text-amber-500'
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "missing_venue": return <Badge variant="destructive">Missing Venue</Badge>
      case "unassigned_crew": return <Badge variant="secondary">No Crew</Badge>
      case "duplicate": return <Badge variant="outline">Duplicate</Badge>
      case "incomplete": return <Badge variant="secondary">Incomplete</Badge>
      default: return <Badge>Issue</Badge>
    }
  }

  const activeIssues = issues.filter(i => !dismissedIds.includes(i.id))

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
            <h1 className="text-lg font-bold">Review Queue</h1>
          </div>
          <Badge variant="secondary">{activeIssues.length} issues</Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Review and resolve potential issues with your fixtures.
        </p>

        {activeIssues.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">All Clear!</h2>
            <p className="text-sm text-muted-foreground">
              No issues found with your fixtures.
            </p>
          </div>
        ) : (
          activeIssues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${getSeverityColor(issue.severity)}`} />
                    <CardTitle className="text-base">
                      {issue.fixture.home_team} vs {issue.fixture.away_team}
                    </CardTitle>
                  </div>
                  {getTypeBadge(issue.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{issue.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(issue.fixture.kickoff_start).toLocaleString()}
                  </div>
                  {issue.fixture.venue_name && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {issue.fixture.venue_name}
                    </div>
                  )}
                  {issue.fixture.crew_names && issue.fixture.crew_names.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {issue.fixture.crew_names.join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    Review
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500"
                    onClick={() => dismissIssue(issue.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Review Dialog */}
      {selectedIssue && (
        <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${getSeverityColor(selectedIssue.severity)}`} />
                {selectedIssue.type === 'missing_venue' ? 'Missing Venue' : 
                 selectedIssue.type === 'unassigned_crew' ? 'Unassigned Crew' :
                 selectedIssue.type === 'duplicate' ? 'Possible Duplicate' : 'Incomplete Data'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedIssue.fixture.home_team} vs {selectedIssue.fixture.away_team}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedIssue.fixture.kickoff_start).toLocaleString()}
                </p>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Issue:</p>
                <p className="text-sm text-muted-foreground">{selectedIssue.description}</p>
              </div>

              {selectedIssue.type === 'missing_venue' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Suggested Actions:</p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/fixtures/${selectedIssue.fixture.id}`}>
                      Edit Fixture to Add Venue
                    </Link>
                  </Button>
                </div>
              )}

              {selectedIssue.type === 'duplicate' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Suggested Actions:</p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/fixtures/${selectedIssue.fixture.id}`}>
                      View Fixture Details
                    </Link>
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    dismissIssue(selectedIssue.id)
                    setSelectedIssue(null)
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedIssue(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
