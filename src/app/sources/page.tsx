"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  X
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { SourceConnection, SourceDefinition } from "@/lib/supabase/database.types"

interface TestResult {
  fixturesFound: number
  fixtures: Array<{
    uid: string
    summary: string
    start: string
    end: string
    location?: string
  }>
  error?: string
}

interface SourceWithDefinition extends SourceConnection {
  definition: SourceDefinition
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'error': return <XCircle className="w-5 h-5 text-red-500" />
    case 'paused': return <AlertTriangle className="w-5 h-5 text-amber-500" />
    case 'pending': return <AlertTriangle className="w-5 h-5 text-blue-500" />
    default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
  }
}

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceWithDefinition[]>([])
  const [definitions, setDefinitions] = useState<SourceDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  // Add source form state
  const [addOpen, setAddOpen] = useState(false)
  const [selectedDefId, setSelectedDefId] = useState("")
  const [sourceName, setSourceName] = useState("")
  const [feedUrl, setFeedUrl] = useState("")
  const [adding, setAdding] = useState(false)

  // Edit source form state
  const [editingSource, setEditingSource] = useState<SourceWithDefinition | null>(null)
  const [editName, setEditName] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources')
      console.log('API response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('API response data:', data)
        console.log('Definitions:', data.definitions)
        console.log('Sources:', data.sources)
        setSources(data.sources || [])
        setDefinitions(data.definitions || [])
      } else {
        const errorData = await res.json()
        console.error('API error:', errorData)
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  async function handleTest(source: SourceWithDefinition) {
    setTestingId(source.id)
    setTestResult(null)
    try {
      const url = source.feed_url_encrypted || ''
      const res = await fetch('/api/test-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (!res.ok) {
        setTestResult({ fixturesFound: 0, fixtures: [], error: data.error || 'Failed' })
      } else {
        setTestResult(data)
      }
    } catch (err) {
      setTestResult({ fixturesFound: 0, fixtures: [], error: err instanceof Error ? err.message : 'Unknown error' })
    }
    setTestingId(null)
  }

  async function handleSync(source: SourceWithDefinition) {
    setSyncingId(source.id)
    try {
      const res = await fetch('/api/sources/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: source.id })
      })
      if (res.ok) {
        await fetchSources()
      }
    } catch (err) {
      console.error('Sync failed:', err)
    }
    setSyncingId(null)
  }

  async function handleAdd() {
    if (!selectedDefId || !sourceName || !feedUrl) return
    setAdding(true)
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_definition_id: selectedDefId,
          name: sourceName,
          connection_method: 'ical_feed',
          feed_url_encrypted: feedUrl,
          refresh_interval_minutes: 60,
        })
      })
      if (res.ok) {
        setAddOpen(false)
        setSelectedDefId('')
        setSourceName('')
        setFeedUrl('')
        await fetchSources()
      }
    } catch (err) {
      console.error('Add failed:', err)
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this source connection?')) return
    try {
      const res = await fetch(`/api/sources?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchSources()
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  async function handleSaveEdit() {
    if (!editingSource) return
    setSavingEdit(true)
    try {
      const res = await fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSource.id,
          name: editName,
          feed_url_encrypted: editUrl,
        })
      })
      if (res.ok) {
        setEditingSource(null)
        await fetchSources()
      }
    } catch (err) {
      console.error('Edit failed:', err)
    }
    setSavingEdit(false)
  }

  const connectedSources = sources
  // Allow multiple connections per platform - show all active definitions
  const availableDefs = definitions

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/more">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-bold">Source Connections</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Add Source Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Source Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Source Connection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Debug info */}
              {definitions.length === 0 && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  No platforms loaded. Count: {definitions.length}
                </div>
              )}
              <div>
                <Label>Source Type</Label>
                <select
                  value={selectedDefId}
                  onChange={(e) => setSelectedDefId(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm bg-white dark:bg-gray-900"
                >
                  <option value="">Select platform...</option>
                  {definitions.map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
                {definitions.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {definitions.length} platforms available
                  </p>
                )}
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. My Assignr Feed"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>iCalendar Feed URL</Label>
                <Input
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://... or webcal://..."
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={adding || !selectedDefId || !sourceName || !feedUrl}
                className="w-full"
              >
                {adding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                {adding ? 'Adding...' : 'Add Connection'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Connected Sources */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Connected ({connectedSources.length})
          </h2>
          {connectedSources.length === 0 && (
            <p className="text-sm text-muted-foreground px-1">No sources connected yet.</p>
          )}
          {connectedSources.map(source => (
            <Card key={source.id} className="mb-3">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(source.status)}
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.definition.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {source.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingSource(source)
                        setEditName(source.name)
                        setEditUrl(source.feed_url_encrypted || '')
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => handleDelete(source.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="capitalize">{source.connection_method.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imported</span>
                    <span>{source.imported_record_count} fixtures</span>
                  </div>
                  {source.last_successful_check && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last sync</span>
                      <span>{new Date(source.last_successful_check).toLocaleString()}</span>
                    </div>
                  )}
                  {source.feed_url_encrypted && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL</span>
                      <span className="truncate max-w-[200px] text-xs">{source.feed_url_encrypted}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSync(source)}
                    disabled={syncingId === source.id}
                  >
                    {syncingId === source.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                    {syncingId === source.id ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTest(source)}
                    disabled={testingId === source.id}
                  >
                    {testingId === source.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    Test
                  </Button>
                </div>

                {testingId === source.id && testResult && (
                  <div className="mt-3 text-sm space-y-2 border-t pt-3">
                    {testResult.error ? (
                      <p className="text-red-500">{testResult.error}</p>
                    ) : (
                      <>
                        <p className="text-green-600 font-medium">
                          Found {testResult.fixturesFound} fixtures
                        </p>
                        {testResult.fixtures.map((f, i) => (
                          <div key={i} className="bg-muted p-2 rounded text-xs">
                            <p className="font-medium">{f.summary}</p>
                            <p className="text-muted-foreground">
                              {new Date(f.start).toLocaleString()}
                            </p>
                            {f.location && <p className="text-muted-foreground">{f.location}</p>}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        {editingSource && (
          <Dialog open={!!editingSource} onOpenChange={() => setEditingSource(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Source</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>iCalendar Feed URL</Label>
                  <Input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="flex-1"
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingSource(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Manual Entry */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Manual Entry</p>
                  <p className="text-xs text-muted-foreground">Add fixtures manually</p>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href="/fixtures/new">Add</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
