// AI Slotting Suggestions Component
// Displays AI-powered slotting optimization suggestions with business impact guardrails

"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react'
import { WmsAIAgents, SlottingSuggestion } from '@/lib/ai/wms-ai-agents'
import { BusinessImpactGuardrails } from '@/lib/ai/wms-ai-agents'

interface AISlottingSuggestionsProps {
  siteId: string
  onSuggestionApply?: (suggestion: SlottingSuggestion) => void
  onSuggestionReject?: (suggestion: SlottingSuggestion) => void
}

export function AISlottingSuggestions({ 
  siteId, 
  onSuggestionApply, 
  onSuggestionReject 
}: AISlottingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SlottingSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false)

  const aiAgents = new WmsAIAgents()
  const guardrails = new BusinessImpactGuardrails()

  // Fetch AI slotting suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!aiEnabled || circuitBreakerOpen) return

    try {
      setLoading(true)
      setError(null)

      const constraints = {
        maxMovesPerDay: 50,
        blackoutWindows: [
          { zone: 'A*', start: '09:00', end: '12:00' }
        ],
        minNetBenefit: 500
      }

      const newSuggestions = await aiAgents.generateSlottingSuggestions(siteId, constraints)
      setSuggestions(newSuggestions)
    } catch (err) {
      console.error('Error fetching AI suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions')
      
      // Open circuit breaker on repeated failures
      if (err instanceof Error && err.message.includes('circuit breaker')) {
        setCircuitBreakerOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }, [siteId, aiEnabled, circuitBreakerOpen])

  // Apply suggestion
  const handleApplySuggestion = useCallback(async (suggestion: SlottingSuggestion) => {
    try {
      // Validate against business impact guardrails
      if (!guardrails.validateSlottingSuggestion(suggestion)) {
        throw new Error('Suggestion does not meet business impact requirements')
      }

      // Apply the suggestion (mock implementation)
      console.log('Applying suggestion:', suggestion)
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.itemId !== suggestion.itemId))
      
      onSuggestionApply?.(suggestion)
    } catch (err) {
      console.error('Error applying suggestion:', err)
      setError(err instanceof Error ? err.message : 'Failed to apply suggestion')
    }
  }, [onSuggestionApply])

  // Reject suggestion
  const handleRejectSuggestion = useCallback((suggestion: SlottingSuggestion) => {
    setSuggestions(prev => prev.filter(s => s.itemId !== suggestion.itemId))
    onSuggestionReject?.(suggestion)
  }, [onSuggestionReject])

  // Reset circuit breaker
  const resetCircuitBreaker = useCallback(() => {
    setCircuitBreakerOpen(false)
    setError(null)
  }, [])

  // Initial load
  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  if (!aiEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Slotting Suggestions
          </CardTitle>
          <CardDescription>
            AI-powered slotting optimization is currently disabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setAiEnabled(true)}>
            <Brain className="h-4 w-4 mr-2" />
            Enable AI Suggestions
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (circuitBreakerOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            AI Service Unavailable
          </CardTitle>
          <CardDescription>
            AI service is temporarily unavailable. Using rule-based fallback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetCircuitBreaker} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry AI Service
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Slotting Suggestions
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          AI-powered slotting optimization with business impact guardrails
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating AI suggestions...</p>
            </div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-sm text-muted-foreground">No optimization suggestions available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Current slotting is already optimized
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.itemId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Item {suggestion.itemId}</h4>
                    <p className="text-sm text-muted-foreground">
                      Move from {suggestion.currentBinId} to {suggestion.suggestedBinId}
                    </p>
                  </div>
                  <Badge variant={suggestion.confidence > 0.8 ? 'default' : 'secondary'}>
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Expected Benefits</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Travel time: -{suggestion.expectedBenefit.travelTimeReduction}s</p>
                      <p>Space utilization: +{Math.round(suggestion.expectedBenefit.spaceUtilization * 100)}%</p>
                      <p>Pick efficiency: +{Math.round(suggestion.expectedBenefit.pickEfficiency * 100)}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Business Impact</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Net benefit: ${suggestion.businessImpact.netBenefit}</p>
                      <p>Payback: {suggestion.businessImpact.paybackDays} days</p>
                      <p>Labor cost: ${suggestion.businessImpact.laborCost}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {suggestion.reason}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApplySuggestion(suggestion)}
                      disabled={!guardrails.validateSlottingSuggestion(suggestion)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRejectSuggestion(suggestion)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchSuggestions}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Suggestions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAiEnabled(false)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Disable AI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

