"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ToggleLeft, ToggleRight } from "lucide-react"

interface EDIConfig {
  transactionSet: string
  name: string
  enabled: boolean
}

const mockEDIConfigs: EDIConfig[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function EDISettings() {
  const [configs, setConfigs] = useState<EDIConfig[]>(mockEDIConfigs)

  const toggleConfig = (transactionSet: string) => {
    setConfigs(configs.map(config =>
      config.transactionSet === transactionSet
        ? { ...config, enabled: !config.enabled }
        : config
    ))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EDI Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {configs.map((config) => (
          <div key={config.transactionSet} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{config.transactionSet}</span>
                  <Badge variant="outline" className="text-xs">{config.name}</Badge>
                </div>
              </div>
              <button
                onClick={() => toggleConfig(config.transactionSet)}
                className="cursor-pointer"
              >
                {config.enabled ? (
                  <ToggleRight className="h-6 w-6 text-green-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

