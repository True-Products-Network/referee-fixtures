"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"

interface CsvRow {
  date: string
  time: string
  home_team: string
  away_team: string
  venue: string
  role: string
  fee: string
  competition: string
  notes: string
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function ImportPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth(true)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<CsvRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCSV = (text: string): CsvRow[] => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows: CsvRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })
      rows.push(row as CsvRow)
    }

    return rows
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setParsing(true)
    setError(null)
    setResult(null)

    try {
      const text = await selected.text()
      const rows = parseCSV(text)
      setPreview(rows.slice(0, 10))
    } catch (err) {
      setError('Failed to parse CSV file')
    } finally {
      setParsing(false)
    }
  }, [])

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Import failed')
      }
    } catch (err) {
      setError('Network error during import')
    } finally {
      setImporting(false)
    }
  }

  if (authLoading) {
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
            <h1 className="text-lg font-bold">Import Data</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drop a CSV file or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="csv-upload">Choose File</label>
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{file.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {preview.length} rows
                </Badge>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{result.success} fixtures imported</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{result.failed} failed</span>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <p key={i}>{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview (first {preview.length} rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-1">Date</th>
                      <th className="text-left py-2 px-1">Time</th>
                      <th className="text-left py-2 px-1">Home</th>
                      <th className="text-left py-2 px-1">Away</th>
                      <th className="text-left py-2 px-1">Venue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 px-1">{row.date}</td>
                        <td className="py-2 px-1">{row.time}</td>
                        <td className="py-2 px-1">{row.home_team}</td>
                        <td className="py-2 px-1">{row.away_team}</td>
                        <td className="py-2 px-1">{row.venue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CSV Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Your CSV should have these columns:
            </p>
            <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
              date,time,home_team,away_team,venue,role,fee,competition,notes
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>date:</strong> YYYY-MM-DD or MM/DD/YYYY</p>
              <p><strong>time:</strong> HH:MM (24-hour) or H:MM AM/PM</p>
              <p><strong>home_team, away_team:</strong> Team names</p>
              <p><strong>venue:</strong> Field or location name</p>
              <p><strong>role:</strong> referee, ar1, ar2, fourth_official</p>
              <p><strong>fee:</strong> Amount in dollars (optional)</p>
              <p><strong>competition, notes:</strong> Optional</p>
            </div>
          </CardContent>
        </Card>

        {/* Import Button */}
        {preview.length > 0 && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {importing ? 'Importing...' : `Import ${preview.length} Fixtures`}
          </Button>
        )}
      </main>
    </div>
  )
}
