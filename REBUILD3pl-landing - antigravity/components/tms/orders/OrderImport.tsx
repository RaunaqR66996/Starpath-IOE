"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function OrderImport() {
  const [file, setFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<'edi' | 'csv' | 'excel'>('csv')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; imported: number; errors: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) return
    
    setImporting(true)
    // TODO: Integrate with import API
    setTimeout(() => {
      setResult({ success: true, imported: 45, errors: 2 })
      setImporting(false)
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Import Type</label>
          <div className="flex gap-2">
            <Button
              variant={importType === 'edi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportType('edi')}
            >
              EDI
            </Button>
            <Button
              variant={importType === 'csv' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportType('csv')}
            >
              CSV
            </Button>
            <Button
              variant={importType === 'excel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportType('excel')}
            >
              Excel
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Select File</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept={importType === 'csv' ? '.csv' : importType === 'excel' ? '.xlsx,.xls' : '.edi'}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {file ? file.name : `Click to upload ${importType.toUpperCase()} file`}
              </p>
            </label>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-gray-500" />
            <span>{file.name}</span>
            <span className="text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className={`h-5 w-5 ${result.success ? 'text-green-600' : 'text-red-600'}`} />
              <span className="font-medium">Import Complete</span>
            </div>
            <div className="flex gap-4 text-sm">
              <Badge variant="outline" className="bg-green-100">
                Imported: {result.imported}
              </Badge>
              {result.errors > 0 && (
                <Badge variant="outline" className="bg-red-100">
                  Errors: {result.errors}
                </Badge>
              )}
            </div>
          </div>
        )}

        <Button onClick={handleImport} disabled={!file || importing} className="w-full">
          {importing ? 'Importing...' : 'Import Orders'}
        </Button>
      </CardContent>
    </Card>
  )
}
