"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Bell, Save, CheckCircle2 } from "lucide-react"

interface NotificationPref {
  type: string
  email: boolean
  sms: boolean
  inApp: boolean
}

const mockPrefs: NotificationPref[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(mockPrefs)
  const [saved, setSaved] = useState(false)

  const updatePref = (index: number, field: keyof NotificationPref, value: boolean) => {
    const newPrefs = [...prefs]
    newPrefs[index] = { ...newPrefs[index], [field]: value }
    setPrefs(newPrefs)
  }

  const handleSave = () => {
    // TODO: Integrate with notification settings API
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {prefs.map((pref, index) => (
          <div key={index} className="border rounded-lg p-3">
            <div className="font-medium mb-3">{pref.type}</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pref.email}
                  onChange={(e) => updatePref(index, 'email', e.target.checked)}
                  className="rounded"
                />
                <Label>Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pref.sms}
                  onChange={(e) => updatePref(index, 'sms', e.target.checked)}
                  className="rounded"
                />
                <Label>SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pref.inApp}
                  onChange={(e) => updatePref(index, 'inApp', e.target.checked)}
                  className="rounded"
                />
                <Label>In-App</Label>
              </div>
            </div>
          </div>
        ))}

        {saved && (
          <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Notification settings saved!</span>
          </div>
        )}

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}

