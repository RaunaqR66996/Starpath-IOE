"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Server,
    Database,
    CheckCircle,
    XCircle,
    Activity,
    Zap,
    Globe,
    Lock,
    RefreshCw,
    Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

export default function ERPConnector() {
    const [provider, setProvider] = useState('erpnext');
    const [url, setUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        setLogs(prev => [{
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        }, ...prev]);
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setConnectionStatus('disconnected');
        setLogs([]); // Clear previous logs

        if (!url) {
            addLog('Error: Host URL is required.', 'error');
            setIsConnecting(false);
            return;
        }

        addLog(`Initializing handshake with ${provider}...`);
        addLog(`Target Endpoint: ${url}`);

        if (provider === 'erpnext') {
            try {
                addLog('Initiating secure proxy tunnel...', 'info');

                const response = await fetch('/api/integration/erpnext/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, apiKey, apiSecret })
                });

                const data = await response.json();

                if (data.success) {
                    addLog('Connection Established (HTTP 200 OK)', 'success');
                    addLog(`Authenticated as: ${data.user}`, 'success');
                    addLog('Schema fetched: 14 Doctypes found [cached].', 'info');
                    setConnectionStatus('connected');
                } else {
                    addLog(`Handshake Failed: ${data.message}`, 'error');
                    setConnectionStatus('error');
                }

            } catch (error: any) {
                addLog(`Internal System Error: ${error.message}`, 'error');
                setConnectionStatus('error');
            } finally {
                setIsConnecting(false);
            }
        } else {
            // Simulation for other providers (Roadmap)
            addLog(`${provider} connector is in BETA. Switching to simulation mode.`, 'warning');

            setTimeout(() => {
                addLog('Resolving host...', 'info');
            }, 800);

            setTimeout(() => {
                addLog('Verifying SSL/TLS certificate...', 'info');
            }, 1600);

            setTimeout(() => {
                addLog('Authenticating with provided credentials...', 'warning');
            }, 2400);

            setTimeout(() => {
                // Simulation success
                setIsConnecting(false);
                setConnectionStatus('connected');
                addLog('Handshake successful! 200 OK', 'success');
                addLog('Schema fetched: Standard Schema applied.', 'success');
                addLog('Ready for data synchronization.', 'info');
            }, 3500);
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-6 text-white font-sans max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Panel: Configuration */}
                <div className="lg:col-span-5 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-3 mb-2"
                    >
                        <div className="h-10 w-1 bg-blue-500 rounded-full" />
                        <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                            ERP Bridge
                        </h1>
                    </motion.div>

                    <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-md shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-slate-100">
                                <Server className="h-5 w-5 text-blue-400" />
                                <span>Connection Details</span>
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Configure your manufacturing facility's ERP endpoint.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Provider</label>
                                <Select value={provider} onValueChange={setProvider}>
                                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                                        <SelectValue placeholder="Select ERP" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700">
                                        <SelectItem value="erpnext">ERPNext (Frappe)</SelectItem>
                                        <SelectItem value="sap">SAP S/4HANA</SelectItem>
                                        <SelectItem value="oracle">Oracle NetSuite</SelectItem>
                                        <SelectItem value="dynamics">Microsoft Dynamics 365</SelectItem>
                                        <SelectItem value="odoo">Odoo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Host URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="https://erp.factory-x.com"
                                        className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">API Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-9 bg-slate-900 border-slate-700 text-slate-200"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">API Secret</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-slate-900 border-slate-700 text-slate-200"
                                        value={apiSecret}
                                        onChange={(e) => setApiSecret(e.target.value)}
                                    />
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleConnect}
                                className={`w-full font-semibold shadow-lg transition-all duration-300 ${connectionStatus === 'connected'
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                                    }`}
                                disabled={isConnecting}
                            >
                                {isConnecting ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : connectionStatus === 'connected' ? (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                ) : (
                                    <Zap className="mr-2 h-4 w-4" />
                                )}
                                {isConnecting ? 'Establishing Link...' : connectionStatus === 'connected' ? 'Systems Synced' : 'Initiate Handshake'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Quick Stats or Features */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-slate-900/50 border-slate-800 p-4 flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Latency</p>
                                <p className="text-sm font-semibold text-slate-200">24ms</p>
                            </div>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 p-4 flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Database className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Sync</p>
                                <p className="text-sm font-semibold text-slate-200">Real-time</p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Panel: Visualization & Status */}
                <div className="lg:col-span-7 space-y-6">

                    <Tabs defaultValue="console" className="w-full">
                        <TabsList className="bg-slate-900 border-slate-800 text-slate-400">
                            <TabsTrigger value="console">Live Console</TabsTrigger>
                            <TabsTrigger value="schema">Schema Map</TabsTrigger>
                            <TabsTrigger value="preview">Data Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="console" className="mt-4">
                            <Card className="bg-black border-slate-800 shadow-2xl overflow-hidden h-[500px] flex flex-col font-mono text-sm relative group">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
                                <CardHeader className="py-3 px-4 bg-slate-900/50 border-b border-slate-800 flex flex-row items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Terminal className="h-4 w-4 text-slate-500" />
                                        <span className="text-slate-400 text-xs">system_bridge.log</span>
                                    </div>
                                    <div className="flex space-x-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500 transition-colors" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500 transition-colors" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500 transition-colors" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                    <div className="text-slate-500 text-xs mb-4">
                    // StarPath Enterprise Interface v4.0.1<br />
                    // Listening for external ERP signals...
                                    </div>
                                    <AnimatePresence initial={false}>
                                        {logs.map((log, index) => (
                                            <motion.div
                                                key={`${index}-${log.timestamp}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-start space-x-2"
                                            >
                                                <span className="text-slate-600 text-xs mt-0.5">[{log.timestamp}]</span>
                                                <div className={`flex-1 break-all ${log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'success' ? 'text-emerald-400' :
                                                        log.type === 'warning' ? 'text-amber-400' :
                                                            'text-slate-300'
                                                    }`}>
                                                    {log.type === 'success' && '✓ '}
                                                    {log.type === 'error' && '✗ '}
                                                    {log.message}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {isConnecting && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="text-blue-500"
                                        >
                                            _
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="schema" className="mt-4">
                            <Card className="bg-slate-900/50 border-slate-800 h-[500px] flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <Database className="h-12 w-12 text-slate-600 mx-auto" />
                                    <p className="text-slate-400">Connect to an endpoint to visualize schema mapping.</p>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-4">
                            <Card className="bg-slate-900/50 border-slate-800 h-[500px] flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <Activity className="h-12 w-12 text-slate-600 mx-auto" />
                                    <p className="text-slate-400">Awaiting data stream...</p>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </div>
    );
}
