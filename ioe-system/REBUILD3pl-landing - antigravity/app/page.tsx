import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Truck, Package, Brain, Map, Box } from 'lucide-react'

export default function AICommandCenter() {
    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="mb-12 flex justify-between items-center border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        BlueShip AI Command Center
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Next-Gen Logistics Orchestration Platform</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                        <Brain className="mr-2 h-4 w-4 text-purple-400" /> AI Agent Active
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* TMS Pro Module */}
                <Link href="/tms3" className="group block h-full">
                    <Card className="bg-gray-900/50 border-gray-800 hover:border-blue-500/50 hover:bg-gray-900 transition-all duration-300 h-full backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-3xl text-blue-400 group-hover:text-blue-300 transition-colors">
                                <Truck className="h-8 w-8" />
                                TMS Pro
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-base">
                                Advanced Transportation Management System
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 p-5 rounded-xl border border-gray-800 group-hover:border-blue-500/30 transition-colors">
                                    <Map className="h-8 w-8 text-blue-500 mb-3" />
                                    <h3 className="font-semibold text-gray-200 text-lg">Live Map</h3>
                                    <p className="text-sm text-gray-500">Real-time fleet tracking & routing</p>
                                </div>
                                <div className="bg-black/40 p-5 rounded-xl border border-gray-800 group-hover:border-blue-500/30 transition-colors">
                                    <Box className="h-8 w-8 text-blue-500 mb-3" />
                                    <h3 className="font-semibold text-gray-200 text-lg">Load Optimizer</h3>
                                    <p className="text-sm text-gray-500">3D AI packing algorithms</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    <span>Route Optimization Engine</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    <span>Carrier Management & Selection</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    <span>Staged Order Integration</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* WMS Pro Module */}
                <Link href="/wms-create" className="group block h-full">
                    <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 hover:bg-gray-900 transition-all duration-300 h-full backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-3xl text-purple-400 group-hover:text-purple-300 transition-colors">
                                <Package className="h-8 w-8" />
                                WMS Pro
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-base">
                                Next-Gen Warehouse Management System
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 p-5 rounded-xl border border-gray-800 group-hover:border-purple-500/30 transition-colors">
                                    <Box className="h-8 w-8 text-purple-500 mb-3" />
                                    <h3 className="font-semibold text-gray-200 text-lg">3D Warehouse</h3>
                                    <p className="text-sm text-gray-500">Digital Twin Visualization</p>
                                </div>
                                <div className="bg-black/40 p-5 rounded-xl border border-gray-800 group-hover:border-purple-500/30 transition-colors">
                                    <Brain className="h-8 w-8 text-purple-500 mb-3" />
                                    <h3 className="font-semibold text-gray-200 text-lg">AI Slotting</h3>
                                    <p className="text-sm text-gray-500">Intelligent inventory placement</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                    <span>Picking, Packing & Staging</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                    <span>Inbound & Outbound Operations</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                    <span>Real-time Inventory Tracking</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <footer className="mt-20 text-center text-gray-600 text-sm">
                <p>Powered by BlueShip AI • v2.0.0-alpha</p>
            </footer>
        </div>
    )
}
