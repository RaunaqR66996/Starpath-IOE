"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, CheckCircle2 } from "lucide-react"

export function SystemConfiguration() {
  const [config, setConfig] = useState({
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    defaultCarrier: 'FedEx Ground',
    autoTendering: true
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: Integrate with settings API
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={config.timezone}
            onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>

        <div>
          <Label htmlFor="dateFormat">Date Format</Label>
          <select
            id="dateFormat"
            value={config.dateFormat}
            onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={config.currency}
            onChange={(e) => setConfig({ ...config, currency: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="defaultCarrier">Default Carrier</Label>
          <Input
            id="defaultCarrier"
            value={config.defaultCarrier}
            onChange={(e) => setConfig({ ...config, defaultCarrier: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoTendering"
            checked={config.autoTendering}
            onChange={(e) => setConfig({ ...config, autoTendering: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="autoTendering">Enable Auto-Tendering</Label>
        </div>

        {saved && (
          <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Configuration saved!</span>
          </div>
        )}

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  )
}

