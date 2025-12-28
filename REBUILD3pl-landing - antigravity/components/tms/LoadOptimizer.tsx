'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Package, Truck, Play, RotateCcw, Settings, Box, Layers, Maximize2, Download, Upload, Plus, Trash2, Brain, BarChart3, FileText, AlertTriangle, CheckCircle2, Zap, TrendingUp, Activity, Shield, Warehouse, Loader2 } from 'lucide-react';
import { useLoadOptimizerStore, TRAILER_PRESETS } from '@/lib/stores/loadOptimizerStore';
import { LoadOptimizationEngine } from '@/lib/optimization/loadOptimization';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { importPalletsFromWMS } from '@/lib/utils/wms-pallet-importer';

const LoadOptimizer3DCanvas = dynamic(() => import('./LoadOptimizer3DCanvas').then(mod => ({ default: mod.LoadOptimizer3DCanvas })), { ssr: false });

const CARGO_FAMILIES = [
  { value: 'ambient', label: 'Ambient', color: '#3B82F6', icon: 'ðŸ“¦' },
  { value: 'frozen', label: 'Frozen', color: '#60A5FA', icon: 'â„ï¸' },
  { value: 'fragile', label: 'Fragile', color: '#F59E0B', icon: 'âš ï¸' },
  { value: 'hazmat', label: 'Hazmat', color: '#EF4444', icon: 'â˜¢ï¸' },
  { value: 'high_value', label: 'High Value', color: '#8B5CF6', icon: 'ðŸ’Ž' },
  { value: 'heavy', label: 'Heavy', color: '#6B7280', icon: 'âš–ï¸' },
];

export function LoadOptimizer() {
  const store = useLoadOptimizerStore();
  const [newItem, setNewItem] = useState({ sku: '', name: '', length: 48, width: 40, height: 48, weight: 50, quantity: 1, stackable: true, rotatable: true, family: 'ambient', priority: 5, stopSequence: 1 });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isImportingWMS, setIsImportingWMS] = useState(false);

  // Memoize handlers to prevent unnecessary re-renders
  const handleAddItem = useCallback(() => {
    if (!newItem.sku || !newItem.name) { 
      toast.error('SKU and Name required'); 
      return; 
    }
    const family = CARGO_FAMILIES.find(f => f.value === newItem.family);
    store.addCargoItem({ 
      ...newItem, 
      id: `cargo-${Date.now()}`, 
      maxStack: 3, 
      fragility: 0, 
      temperature: null, 
      crushStrength: 500, 
      color: family?.color || '#3B82F6' 
    } as any);
    toast.success(`Added ${newItem.quantity}x ${newItem.sku}`);
    setNewItem({ ...newItem, sku: '', name: '', quantity: 1 });
  }, [newItem, store]);

  const handleImportFromWMS = useCallback(async () => {
    setIsImportingWMS(true);
    try {
      // Import pallets from the default warehouse (warehouse-001)
      // You can extend this to allow selecting a specific warehouse
      const cargoItems = await importPalletsFromWMS('warehouse-001', 1000, 2);
      
      if (cargoItems.length === 0) {
        toast.error('No pallets found in warehouse');
        return;
      }
      
      // Add all cargo items to the store
      cargoItems.forEach(item => store.addCargoItem(item));
      
      const totalPallets = cargoItems.reduce((sum, item) => sum + item.quantity, 0);
      toast.success(`Imported ${totalPallets} pallets from WMS`);
    } catch (error) {
      console.error('Failed to import from WMS:', error);
      toast.error('Failed to import pallets from WMS');
    } finally {
      setIsImportingWMS(false);
    }
  }, [store]);

  const handleOptimize = useCallback(async () => {
    if (!store.selectedTrailer || store.cargoItems.length === 0) return;
    
    setIsOptimizing(true);
    store.setOptimizing(true);
    
    try {
      const engine = new LoadOptimizationEngine(
        store.selectedTrailer, 
        store.cargoItems, 
        (p) => store.setOptimizationProgress(p)
      );
      
      const result = await engine.optimize();
      store.setOptimizationResult(result);
      store.setPlacedCargo(result.placedItems);
      store.setActiveTab('visualization');
      toast.success(`Optimized! ${result.volumeUtilization.toFixed(1)}% utilization`);
    } catch (error) {
      console.error('Optimization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('timeout')) {
        toast.info('Using optimized fallback method...');
      } else {
        toast.error(`Optimization failed: ${errorMessage}`);
      }
    } finally {
      setIsOptimizing(false);
      store.setOptimizing(false);
    }
  }, [store]);

  const totalItems = store.cargoItems.reduce((s, i) => s + i.quantity, 0);
  const totalWeight = store.cargoItems.reduce((s, i) => s + i.weight * i.quantity, 0);
  const totalVolume = store.cargoItems.reduce((s, i) => s + i.length * i.width * i.height * i.quantity, 0);
  const trailerVolume = store.selectedTrailer ? store.selectedTrailer.innerLength * store.selectedTrailer.innerWidth * store.selectedTrailer.innerHeight : 1;
  const trailerCapacity = store.selectedTrailer ? store.selectedTrailer.maxGrossWeight - store.selectedTrailer.tareWeight : 1;
  const volumeUtil = (totalVolume / trailerVolume * 100).toFixed(1);
  const weightUtil = (totalWeight / trailerCapacity * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl"><Layers className="h-8 w-8 text-white" /></div>
                <div>
                  <CardTitle className="text-3xl flex items-center gap-2">3D Load Optimizer <Badge className="bg-gradient-to-r from-blue-600 to-purple-600"><Brain className="h-3 w-3 mr-1" />AI-Powered</Badge></CardTitle>
                  <CardDescription className="text-base">Enterprise-grade 3D bin packing with genetic algorithm</CardDescription>
                </div>
              </div>
              {store.selectedTrailer && (
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline"><Truck className="h-4 w-4 mr-1" />{store.selectedTrailer.name}</Badge>
                  <div className="flex gap-2"><Badge variant="outline" className="text-xs">{store.selectedTrailer.innerLength}" Ã— {store.selectedTrailer.innerWidth}" Ã— {store.selectedTrailer.innerHeight}"</Badge></div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.02 }}><Card className="border-l-4 border-blue-600"><CardContent className="pt-6"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-600">Volume</span><Maximize2 className="h-5 w-5 text-blue-600" /></div><div className="text-3xl font-bold text-blue-600">{volumeUtil}%</div><div className="w-full bg-gray-200 rounded-full h-3 mt-3"><motion.div className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(parseFloat(volumeUtil), 100)}%` }} /></div></CardContent></Card></motion.div>
        <motion.div whileHover={{ scale: 1.02 }}><Card className="border-l-4 border-green-600"><CardContent className="pt-6"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-600">Weight</span><Activity className="h-5 w-5 text-green-600" /></div><div className="text-3xl font-bold text-green-600">{weightUtil}%</div><div className="w-full bg-gray-200 rounded-full h-3 mt-3"><motion.div className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(parseFloat(weightUtil), 100)}%` }} /></div></CardContent></Card></motion.div>
        <motion.div whileHover={{ scale: 1.02 }}><Card className="border-l-4 border-purple-600"><CardContent className="pt-6"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-600">Cargo</span><Package className="h-5 w-5 text-purple-600" /></div><div className="text-3xl font-bold text-purple-600">{totalItems}</div><div className="text-xs text-gray-500 mt-3">{store.cargoItems.length} SKUs, {store.placedCargo.length} placed</div></CardContent></Card></motion.div>
        <motion.div whileHover={{ scale: 1.02 }}><Card className="border-l-4 border-orange-600"><CardContent className="pt-6"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-600">Score</span><TrendingUp className="h-5 w-5 text-orange-600" /></div><div className="text-3xl font-bold text-orange-600">{store.optimizationResult ? store.optimizationResult.stabilityScore.toFixed(0) : '--'}</div></CardContent></Card></motion.div>
      </div>

      <Card><Tabs value={store.activeTab} onValueChange={store.setActiveTab}>
        <TabsList className="grid w-full grid-cols-6"><TabsTrigger value="fleet"><Truck className="h-4 w-4" /><span className="hidden md:inline ml-2">Fleet</span></TabsTrigger><TabsTrigger value="cargo"><Package className="h-4 w-4" /><span className="hidden md:inline ml-2">Cargo</span></TabsTrigger><TabsTrigger value="constraints"><Settings className="h-4 w-4" /><span className="hidden md:inline ml-2">Rules</span></TabsTrigger><TabsTrigger value="visualization"><Box className="h-4 w-4" /><span className="hidden md:inline ml-2">3D</span></TabsTrigger><TabsTrigger value="analytics"><BarChart3 className="h-4 w-4" /><span className="hidden md:inline ml-2">Analytics</span></TabsTrigger><TabsTrigger value="reports"><FileText className="h-4 w-4" /><span className="hidden md:inline ml-2">Reports</span></TabsTrigger></TabsList>
        
        <TabsContent value="fleet" className="p-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{TRAILER_PRESETS.map((t) => (<motion.div key={t.id} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }}><Card className={`cursor-pointer ${store.selectedTrailer?.id === t.id ? 'ring-2 ring-blue-600 bg-blue-50' : 'hover:ring-2 hover:ring-gray-300'}`} onClick={() => store.setSelectedTrailer(t)}><CardContent className="pt-6"><div className="flex items-center justify-between mb-3"><h4 className="font-semibold text-lg">{t.name}</h4>{store.selectedTrailer?.id === t.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}</div><div className="space-y-2 text-sm text-gray-600"><div className="flex justify-between"><span>Dims:</span><span className="font-medium">{t.innerLength}" Ã— {t.innerWidth}" Ã— {t.innerHeight}"</span></div><div className="flex justify-between"><span>Max:</span><span className="font-medium">{(t.maxGrossWeight / 1000).toFixed(0)}k lbs</span></div></div></CardContent></Card></motion.div>))}</div></TabsContent>
        
        <TabsContent value="cargo" className="p-6"><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="lg:col-span-1"><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Cargo</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>SKU *</Label><Input placeholder="PALLET-001" value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} /></div><div className="space-y-2"><Label>Name *</Label><Input placeholder="Standard Pallet" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} /></div><div className="grid grid-cols-3 gap-2"><div className="space-y-2"><Label>L (in)</Label><Input type="number" value={newItem.length} onChange={(e) => setNewItem({ ...newItem, length: parseFloat(e.target.value) })} /></div><div className="space-y-2"><Label>W (in)</Label><Input type="number" value={newItem.width} onChange={(e) => setNewItem({ ...newItem, width: parseFloat(e.target.value) })} /></div><div className="space-y-2"><Label>H (in)</Label><Input type="number" value={newItem.height} onChange={(e) => setNewItem({ ...newItem, height: parseFloat(e.target.value) })} /></div></div><div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>Weight (lbs)</Label><Input type="number" value={newItem.weight} onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) })} /></div><div className="space-y-2"><Label>Qty</Label><Input type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })} /></div></div><div className="space-y-2"><Label>Family</Label><Select value={newItem.family} onValueChange={(v: any) => setNewItem({ ...newItem, family: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CARGO_FAMILIES.map((f) => (<SelectItem key={f.value} value={f.value}>{f.icon} {f.label}</SelectItem>))}</SelectContent></Select></div><div className="flex items-center justify-between"><Label>Stackable</Label><Switch checked={newItem.stackable} onCheckedChange={(c) => setNewItem({ ...newItem, stackable: c })} /></div><Button onClick={handleAddItem} className="w-full bg-blue-600"><Plus className="h-4 w-4 mr-2" />Add Cargo</Button><Button variant="outline" className="w-full" onClick={handleImportFromWMS} disabled={isImportingWMS}>{isImportingWMS ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Warehouse className="h-4 w-4 mr-2" />}{isImportingWMS ? 'Importing...' : 'Import from WMS'}</Button><Button variant="outline" className="w-full"><Upload className="h-4 w-4 mr-2" />Import CSV</Button></CardContent></Card><Card className="lg:col-span-2"><CardHeader><div className="flex items-center justify-between"><CardTitle><Package className="h-5 w-5 inline mr-2" />Cargo Library ({store.cargoItems.length} SKUs)</CardTitle><Button variant="outline" size="sm" onClick={() => store.cargoItems.forEach(i => store.removeCargoItem(i.id))} disabled={store.cargoItems.length === 0}><Trash2 className="h-4 w-4 mr-2" />Clear</Button></div></CardHeader><CardContent>{store.cargoItems.length === 0 ? <div className="text-center py-12"><Package className="h-16 w-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-600">No cargo items</p></div> : <div className="space-y-2 max-h-[500px] overflow-y-auto">{store.cargoItems.map((item) => { const family = CARGO_FAMILIES.find(f => f.value === item.family); return (<div key={item.id} className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200"><div className="flex items-center gap-4 flex-1"><div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: item.color + '20', border: `2px solid ${item.color}` }}>{family?.icon}</div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-semibold">{item.sku}</span><Badge variant="outline" className="text-xs">{item.quantity}x</Badge></div><div className="text-sm text-gray-600">{item.name}</div><div className="flex gap-3 text-xs text-gray-500 mt-1"><span>ðŸ“ {item.length}Ã—{item.width}Ã—{item.height}"</span><span>âš–ï¸ {item.weight} lbs</span></div></div></div><Button variant="ghost" size="sm" onClick={() => store.removeCargoItem(item.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>); })}</div>}</CardContent></Card></div></TabsContent>
        
        <TabsContent value="constraints" className="p-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-600" />Safety & Compliance Rules</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Object.entries({ maxHeight: { label: 'Max Height', desc: 'Enforce height limits', icon: 'ðŸ“' }, maxWeight: { label: 'Max Weight', desc: 'DOT compliance', icon: 'âš–ï¸' }, fragileProtection: { label: 'Fragile Protection', desc: 'Top placement priority', icon: 'âš ï¸' }, temperatureZoning: { label: 'Temp Zones', desc: 'Separate frozen/ambient', icon: 'â„ï¸' }, sequenceRespect: { label: 'LIFO/FIFO', desc: 'Delivery sequencing', icon: 'ðŸ”„' }, hazmatSeparation: { label: 'Hazmat Rules', desc: 'IMDG/ADR compliance', icon: 'â˜¢ï¸' } }).map(([key, cfg]) => (<div key={key} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-lg">{cfg.icon}</span><Label className="font-semibold">{cfg.label}</Label></div><p className="text-xs text-gray-600">{cfg.desc}</p></div><Switch checked={store.constraints[key as keyof typeof store.constraints]} onCheckedChange={() => store.toggleConstraint(key as any)} /></div>))}</div></CardContent></Card></TabsContent>
        
        <TabsContent value="visualization" className="p-0"><div className="h-[700px]">{store.selectedTrailer ? <LoadOptimizer3DCanvas trailer={store.selectedTrailer} placedCargo={store.placedCargo} centerOfGravity={store.optimizationResult ? { x: store.optimizationResult.centerOfGravityX, y: store.optimizationResult.centerOfGravityY, z: store.optimizationResult.centerOfGravityZ } : undefined} showGrid={store.showGrid} showCenterOfGravity={store.showCenterOfGravity} highlightedItem={store.highlightedItem} onItemClick={store.setHighlightedItem} /> : <div className="h-full flex items-center justify-center bg-gray-900 text-white"><Truck className="h-16 w-16 mx-auto mb-4 opacity-50" /><p>Select a trailer</p></div>}</div></TabsContent>
        
        <TabsContent value="analytics" className="p-6">{store.optimizationResult ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Load Distribution</CardTitle></CardHeader><CardContent className="space-y-4"><div><div className="flex justify-between text-sm mb-2"><span>Front Axle:</span><span className="font-bold">{(store.optimizationResult.axleLoadFront / 1000).toFixed(1)}k lbs</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(store.optimizationResult.axleLoadFront / 34000) * 100}%` }} /></div></div><div><div className="flex justify-between text-sm mb-2"><span>Rear Axle:</span><span className="font-bold">{(store.optimizationResult.axleLoadRear / 1000).toFixed(1)}k lbs</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${(store.optimizationResult.axleLoadRear / 34000) * 100}%` }} /></div></div><div className="pt-4 border-t"><p className="text-sm font-medium mb-2">Center of Gravity:</p><div className="grid grid-cols-3 gap-2 text-xs"><div className="bg-gray-50 p-2 rounded"><p className="text-gray-600">X</p><p className="font-bold">{store.optimizationResult.centerOfGravityX.toFixed(1)}"</p></div><div className="bg-gray-50 p-2 rounded"><p className="text-gray-600">Y</p><p className="font-bold">{store.optimizationResult.centerOfGravityY.toFixed(1)}"</p></div><div className="bg-gray-50 p-2 rounded"><p className="text-gray-600">Z</p><p className="font-bold">{store.optimizationResult.centerOfGravityZ.toFixed(1)}"</p></div></div></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Efficiency</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex justify-between"><span className="text-sm">Loading Time:</span><span className="font-bold">{store.optimizationResult.loadingTime} min</span></div><div className="flex justify-between"><span className="text-sm">Carbon Footprint:</span><span className="font-bold text-green-600">{store.optimizationResult.carbonFootprint.toFixed(1)} kg COâ‚‚</span></div><div className="flex justify-between"><span className="text-sm">Compliance:</span><span className="font-bold">{store.optimizationResult.complianceScore.toFixed(0)}%</span></div></CardContent></Card></div> : <div className="text-center py-12"><BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-600">Run optimization to view analytics</p></div>}</TabsContent>
        
        <TabsContent value="reports" className="p-6"><div className="text-center py-12"><FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-600 mb-6">Generate load plan reports</p><div className="flex gap-4 justify-center"><Button variant="outline"><Download className="h-4 w-4 mr-2" />PDF</Button><Button variant="outline"><Download className="h-4 w-4 mr-2" />JSON</Button></div></div></TabsContent>
      </Tabs></Card>

      <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><Button variant="outline" onClick={store.reset} disabled={store.placedCargo.length === 0}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>{store.isOptimizing && <div className="flex items-center gap-3"><div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" /><span className="text-sm">Optimizing...</span><div className="w-48 bg-gray-200 rounded-full h-2"><motion.div className="bg-blue-600 h-2 rounded-full" style={{ width: `${store.optimizationProgress}%` }} /></div></div>}</div><Button onClick={handleOptimize} disabled={store.cargoItems.length === 0 || store.isOptimizing || !store.selectedTrailer} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600"><Zap className="h-5 w-5 mr-2" />AI Optimize Load</Button></div></CardContent></Card>
    </div>
  );
}
