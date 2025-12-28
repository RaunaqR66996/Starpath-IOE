"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  Users, 
  Bell,
  Shield,
  Database,
  Cloud
} from 'lucide-react'

export function TMSSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">System Settings</h2>
        <p className="text-sm text-gray-600">Configure TMS system settings</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-assign shipments</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email notifications</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SMS alerts</span>
                <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Exception alerts</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Delivery confirmations</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Route updates</span>
                <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Two-factor authentication</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API rate limiting</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit logging</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-backup</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data retention (90 days)</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Export capabilities</span>
                <div className="w-10 h-5 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Version</p>
              <p className="font-medium">v2.1.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">Jan 15, 2024</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Database</p>
              <p className="font-medium">PostgreSQL 14</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="font-medium">99.9%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





