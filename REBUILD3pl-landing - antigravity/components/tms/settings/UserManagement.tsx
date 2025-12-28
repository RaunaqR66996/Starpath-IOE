"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Plus, Edit } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const mockUsers: User[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function UserManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management</span>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockUsers.map((user) => (
          <div key={user.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user.role}</Badge>
                <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {user.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

