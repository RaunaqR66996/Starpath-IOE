"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  status: string
}

const mockUsers: User[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ConfigUsers({ siteId }: { siteId: string }) {
  const [users] = useState<User[]>(mockUsers)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Users & Roles</span>
        <Badge variant="outline" className="text-xs">{users.length} Users</Badge>
      </div>
      
      <div className="space-y-0.5">
        {users.map((user) => (
          <div key={user.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Users className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{user.name}</div>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {user.status}
                </Badge>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{user.role}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

