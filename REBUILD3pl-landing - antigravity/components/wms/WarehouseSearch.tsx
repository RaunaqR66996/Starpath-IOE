"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Package, 
  MapPin, 
  ClipboardList, 
  X, 
  ZoomIn,
  Loader2
} from 'lucide-react'

interface SearchResult {
  type: 'inventory' | 'location' | 'task'
  id: string
  title: string
  subtitle: string
  qty?: number
  location?: {
    id: string
    zone?: string
    aisle?: string
    bay?: string
    level?: string
  }
  item?: {
    sku: string
    name: string
  }
  status?: string
  priority?: string
  quantity?: number
}

interface WarehouseSearchProps {
  siteId: string
  onResultClick: (result: SearchResult) => void
  onClear: () => void
  highlightedBinIds: string[]
}

export function WarehouseSearch({ siteId, onResultClick, onClear, highlightedBinIds }: WarehouseSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, siteId])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !siteId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/wms/${siteId}/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    onClear()
    inputRef.current?.focus()
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'location':
        return <MapPin className="h-4 w-4 text-green-500" />
      case 'task':
        return <ClipboardList className="h-4 w-4 text-orange-500" />
      default:
        return <Search className="h-4 w-4 text-gray-500" />
    }
  }

  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'bg-blue-100 text-blue-800'
      case 'location':
        return 'bg-green-100 text-green-800'
      case 'task':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLocation = (location?: SearchResult['location']) => {
    if (!location) return ''
    const parts = [location.zone, location.aisle, location.bay, location.level].filter(Boolean)
    return parts.join('-')
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder="Search SKU, bin, lot, task..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="uber-input"
          style={{ paddingLeft: '4rem', paddingRight: '3rem' }}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto uber-card">
          <CardContent className="p-2">
            <div className="space-y-1">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}-${index}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getResultIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {result.subtitle}
                      </p>
                      {result.location && (
                        <p className="text-xs text-gray-500">
                          Location: {formatLocation(result.location)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getResultBadgeColor(result.type)}`}>
                      {result.type}
                    </Badge>
                    {result.qty && (
                      <span className="text-xs text-gray-500">
                        Qty: {result.qty}
                      </span>
                    )}
                    <ZoomIn className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !loading && query && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 uber-card">
          <CardContent className="p-4 text-center">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-600">No results found for "{query}"</p>
            <p className="text-xs text-gray-500 mt-1">
              Try searching for SKU, bin location, or task ID
            </p>
          </CardContent>
        </Card>
      )}

      {/* Highlighted Bins Indicator */}
      {highlightedBinIds.length > 0 && (
        <div className="mt-2 flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {highlightedBinIds.length} bin{highlightedBinIds.length > 1 ? 's' : ''} highlighted
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleClear}
          >
            Clear highlights
          </Button>
        </div>
      )}
    </div>
  )
}
