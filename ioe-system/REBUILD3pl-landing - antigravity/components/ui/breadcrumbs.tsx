"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { usePathname } from "next/navigation"
import { Fragment } from "react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
    label: string
    href: string
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[]
    className?: string
}

/**
 * Generate breadcrumbs from current pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Map of route segments to readable labels
    const labelMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'tms3': 'TMS',
        'wms-create': 'WMS',
        'orders': 'Orders',
        'shipments': 'Shipments',
        'inventory': 'Inventory',
        'carriers': 'Carriers',
        'rates': 'Rates',
        'tracking': 'Tracking',
        'documents': 'Documents',
        'audit': 'Freight Audit',
        'analytics': 'Analytics',
        'exceptions': 'Exceptions',
        'settings': 'Settings',
        'load-planning': 'Load Planning',
        'inbound': 'Inbound',
        'outbound': 'Outbound',
        'sites': 'Sites',
        'tasks': 'Tasks',
        'staging': 'Staging',
    }

    let currentPath = ''
    paths.forEach((segment, index) => {
        currentPath += `/${segment}`
        breadcrumbs.push({
            label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
            href: currentPath,
        })
    })

    return breadcrumbs
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    const pathname = usePathname()
    const breadcrumbs = items || generateBreadcrumbs(pathname || '')

    // Don't show breadcrumbs on home page
    if (!breadcrumbs.length || pathname === '/') {
        return null
    }

    return (
        <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
            <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Home"
            >
                <Home className="h-4 w-4" />
            </Link>

            {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1

                return (
                    <Fragment key={item.href}>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        {isLast ? (
                            <span className="font-medium text-gray-900" aria-current="page">
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                href={item.href}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                {item.label}
                            </Link>
                        )}
                    </Fragment>
                )
            })}
        </nav>
    )
}
