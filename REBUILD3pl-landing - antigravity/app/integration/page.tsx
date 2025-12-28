"use client"

import React from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import ERPConnector from '@/components/integration/ERPConnector'
import { motion } from 'framer-motion'

export default function IntegrationPage() {
    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white p-4 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto"
                >
                    <div className="mb-8 pl-1">
                        <h2 className="text-sm font-mono text-blue-400 mb-2">// SYSTEM INTERFACE</h2>
                        <p className="text-slate-400 max-w-2xl">
                            Establish a secure, bidirectional uplink with your manufacturing facility's ERP backbone.
                            This module supports automated schema mapping, data syncing, and real-time event triggers.
                        </p>
                    </div>

                    <ERPConnector />
                </motion.div>
            </div>
        </DashboardLayout>
    )
}
