'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trailer3D } from './Trailer3D';
import { packTrailer } from '@/lib/engine/greedy-packer';
import { STANDARD_53FT_TRAILER, SAMPLE_CARGO, OptimizeResult, CargoItem, TrailerSpec } from '@/lib/types/trailer';
import { Package, Truck, AlertTriangle, CheckCircle, Settings, Download, Upload, RefreshCw, Zap, FileText, BarChart3, AlertCircle, Info } from 'lucide-react';
import { ExportService } from '@/lib/services/export-service';
import { ExceptionHandler, OptimizationException } from '@/lib/services/exception-handler';
import { getReadyToShipItems } from '@/app/actions/tms';
import { toast } from 'sonner';

// Extended trailer type with id and name
interface ExtendedTrailerSpec extends TrailerSpec {
  id: string;
  name: string;
}

// Trailer presets for dynamic selection
const TRAILER_PRESETS: ExtendedTrailerSpec[] = [
  { ...STANDARD_53FT_TRAILER, id: '53ft-dry', name: '53ft Dry Van' },
  { ...STANDARD_53FT_TRAILER, id: '53ft-reefer', name: '53ft Reefer', height_ft: 8.5 },
  { ...STANDARD_53FT_TRAILER, id: '48ft-flatbed', name: '48ft Flatbed', length_ft: 48, height_ft: 8.0 },
  { ...STANDARD_53FT_TRAILER, id: '40ft-container', name: '40ft Container', length_ft: 40, width_ft: 8.0, height_ft: 8.5 }
];

// Algorithm options
const ALGORITHMS = [
  { value: 'greedy', label: 'Greedy Bottom-Left-Back', description: 'Fast, good for simple loads' },
  { value: 'genetic', label: 'Genetic Algorithm', description: 'Advanced optimization, slower but better results' },
  { value: 'heuristic', label: 'Heuristic Hybrid', description: 'Balanced approach with multiple strategies' }
];

export function LoadOptimizerPanel() {
  // const { state: tmsState } = useTMSContext();
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<ExtendedTrailerSpec>(TRAILER_PRESETS[0]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('greedy');
  const [cargoData, setCargoData] = useState<CargoItem[]>(SAMPLE_CARGO);
  const [constraints, setConstraints] = useState({
    maxHeight: true,
    maxWeight: true,
    fragileProtection: true,
    hazmatSeparation: false,
    deliverySequence: true,
    temperatureZoning: false
  });
  const [activeTab, setActiveTab] = useState('optimize');
  const [showWarnings, setShowWarnings] = useState(true);
  const [exceptions, setExceptions] = useState<OptimizationException[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newOrder, setNewOrder] = useState({
    id: 'ORD-001',
    length: 4,
    width: 4,
    height: 4,
    weight: 2000,
    quantity: 1,
    stackable: true,
  });

  // Load real cargo data from DB
  const loadRealData = async () => {
    try {
      toast.info('Fetching ready-to-ship items...');
      const items = await getReadyToShipItems();
      if (items.length > 0) {
        setCargoData(items);
        toast.success(`Loaded ${items.length} items from WMS`);
      } else {
        toast.warning('No ready-to-ship items found');
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      toast.error('Failed to load items from WMS');
    }
  };

  useEffect(() => {
    // Optional: Auto-load on mount
    // loadRealData();
  }, []);

  const handleOptimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOptimizing) return;

    setIsOptimizing(true);

    // Use requestAnimationFrame to ensure UI updates before heavy computation
    requestAnimationFrame(() => {
      try {
        // Run optimization in next tick to prevent blocking
        setTimeout(() => {
          try {
            const optimizationResult = packTrailer(cargoData, selectedTrailer);
            setResult(optimizationResult);

            // Analyze for exceptions and suggestions
            const detectedExceptions = ExceptionHandler.analyzeResult(optimizationResult, selectedTrailer);
            const improvementSuggestions = ExceptionHandler.getSuggestions(detectedExceptions);

            setExceptions(detectedExceptions);
            setSuggestions(improvementSuggestions);
            setActiveTab('results');
          } catch (error) {
            console.error('Optimization failed:', error);
          } finally {
            setIsOptimizing(false);
          }
        }, 50); // Small delay to ensure UI updates
      } catch (error) {
        console.error('Optimization failed:', error);
        setIsOptimizing(false);
      }
    });
  };

  const handleClear = () => {
    setResult(null);
    setActiveTab('optimize');
  };

  const handleExportPDF = () => {
    if (!result) return;

    const exportData = {
      result,
      trailer: selectedTrailer,
      timestamp: new Date().toISOString(),
      algorithm: selectedAlgorithm,
      constraints
    };

    ExportService.exportHTML(exportData); // Using HTML as PDF alternative
  };

  const handleExportCSV = () => {
    if (!result) return;

    const exportData = {
      result,
      trailer: selectedTrailer,
      timestamp: new Date().toISOString(),
      algorithm: selectedAlgorithm,
      constraints
    };

    ExportService.exportCSV(exportData);
  };

  const handleExportJSON = () => {
    if (!result) return;

    const exportData = {
      result,
      trailer: selectedTrailer,
      timestamp: new Date().toISOString(),
      algorithm: selectedAlgorithm,
      constraints
    };

    ExportService.exportJSON(exportData);
  };

  const handleLoadFromFile = () => {
    // TODO: Implement file upload
    console.log('Loading cargo from file...');
  };

  const handleAddOrder = () => {
    const length = Number(newOrder.length) || 0;
    const width = Number(newOrder.width) || 0;
    const height = Number(newOrder.height) || 0;
    const weight = Number(newOrder.weight) || 0;
    const quantity = Math.max(1, Number(newOrder.quantity) || 1);
    if (!length || !width || !height || !weight) {
      return;
    }

    const orientationOptions = newOrder.stackable
      ? [[0, 1, 2], [1, 0, 2]]
      : [[0, 1, 2]];

    const newItems: CargoItem[] = Array.from({ length: quantity }, (_, idx) => ({
      id: `${newOrder.id || 'ORDER'}-${Date.now()}-${idx + 1}`,
      l: length,
      w: width,
      h: height,
      weight_lbs: weight,
      stackable: newOrder.stackable,
      orientations: orientationOptions,
    }));

    setCargoData(prev => {
      const updated = [...prev, ...newItems];
      try {
        const optimizationResult = packTrailer(updated, selectedTrailer);
        setResult(optimizationResult);
        const detectedExceptions = ExceptionHandler.analyzeResult(optimizationResult, selectedTrailer);
        const improvementSuggestions = ExceptionHandler.getSuggestions(detectedExceptions);
        setExceptions(detectedExceptions);
        setSuggestions(improvementSuggestions);
        setActiveTab('visualize');
      } catch (error) {
        console.error('Optimization failed:', error);
      }
      return updated;
    });

    setNewOrder(prev => ({
      ...prev,
      id: `ORD-${Math.floor(Math.random() * 900 + 100)}`,
    }));
  };

  const metrics = useMemo(() => {
    if (!result) return null;

    const overloadedAxles = result.axle_loads.filter(axle => axle.percentage > 100);
    const warningAxles = result.axle_loads.filter(axle => axle.percentage > 80 && axle.percentage <= 100);
    const totalWeight = result.placed.reduce((sum, item) => sum + 1000, 0); // Default weight since PlacedItem doesn't have weight_lbs
    const maxWeight = selectedTrailer.max_gvw_lbs || 80000;
    const weightUtilization = (totalWeight / maxWeight) * 100;

    return {
      utilization: Math.round(result.utilization_pct),
      weightUtilization: Math.round(weightUtilization),
      cogX: result.cog[0].toFixed(1),
      cogY: result.cog[1].toFixed(1),
      cogZ: result.cog[2].toFixed(1),
      placed: result.placed.length,
      unplaced: result.unplaced.length,
      overloadedAxles: overloadedAxles.length,
      warningAxles: warningAxles.length,
      maxAxleLoad: Math.max(...result.axle_loads.map(a => a.percentage)),
      totalWeight: Math.round(totalWeight),
      stabilityScore: result.placed.length > 0 ? Math.round((1 - Math.abs(result.cog[0] - selectedTrailer.length_ft / 2) / (selectedTrailer.length_ft / 2)) * 100) : 0
    };
  }, [result, selectedTrailer]);

  const warnings = useMemo(() => {
    if (!result || !showWarnings || !metrics) return [];

    const warnings: Array<{ type: 'error' | 'warning' | 'info'; message: string }> = [];
    if (metrics.overloadedAxles > 0) {
      warnings.push({ type: 'error' as const, message: `${metrics.overloadedAxles} axle(s) overloaded` });
    }
    if (metrics.warningAxles > 0) {
      warnings.push({ type: 'warning' as const, message: `${metrics.warningAxles} axle(s) near limit` });
    }
    if (metrics.unplaced > 0) {
      warnings.push({ type: 'info' as const, message: `${metrics.unplaced} item(s) could not be placed` });
    }
    if (metrics.weightUtilization > 90) {
      warnings.push({ type: 'warning' as const, message: 'Weight utilization near maximum' });
    }
    if (metrics.stabilityScore < 70) {
      warnings.push({ type: 'warning' as const, message: 'Low stability score - consider repositioning' });
    }

    return warnings;
  }, [result, metrics, showWarnings]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Executive Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-slate-800">Load Optimizer</span>
          <span className="text-sm text-slate-600 font-medium"> {cargoData.length} items • {selectedTrailer.name}</span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleOptimize}
            disabled={isOptimizing || cargoData.length === 0}
            className="h-8 px-4 text-sm font-semibold bg-sp-primary hover:bg-[#0a1b2e] text-white sp-shadow hover:sp-shadow-hover transition-all duration-200"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Optimize Now
              </>
            )}
          </Button>
          {result && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="h-7 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-5 mb-2 h-7">
          <TabsTrigger value="optimize" className="text-xs py-1">
            <Settings className="h-3 w-3 mr-1" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="visualize" className="text-xs py-1">
            <Package className="h-3 w-3 mr-1" />
            3D View
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs py-1">
            <BarChart3 className="h-3 w-3 mr-1" />
            Results
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="text-xs py-1">
            <AlertCircle className="h-3 w-3 mr-1" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs py-1">
            <Download className="h-3 w-3 mr-1" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimize" className="flex-1 space-y-2 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Create Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Order ID</Label>
                  <Input
                    value={newOrder.id}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, id: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="ORD-001"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Length (ft)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={newOrder.length}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, length: Number(e.target.value) }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Width (ft)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={newOrder.width}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, width: Number(e.target.value) }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height (ft)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={newOrder.height}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, height: Number(e.target.value) }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Weight (lbs)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={50}
                    value={newOrder.weight}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between mt-6">
                  <Label className="text-xs">Stackable</Label>
                  <Switch
                    checked={newOrder.stackable}
                    onCheckedChange={(checked) => setNewOrder(prev => ({ ...prev, stackable: checked }))}
                    className="scale-75"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddOrder}
                className="w-full h-8 text-sm bg-sp-primary text-white sp-shadow hover:sp-shadow-hover"
              >
                Add to Load
              </Button>
            </CardContent>
          </Card>

          {/* Trailer Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Trailer Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Trailer Type</Label>
                <Select value={selectedTrailer.id} onValueChange={(value) => {
                  const trailer = TRAILER_PRESETS.find(t => t.id === value);
                  if (trailer) setSelectedTrailer(trailer);
                }}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAILER_PRESETS.map(trailer => (
                      <SelectItem key={trailer.id} value={trailer.id}>
                        {trailer.name} ({trailer.length_ft}ft × {trailer.width_ft}ft × {trailer.height_ft}ft)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Algorithm</Label>
                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALGORITHMS.map(algo => (
                      <SelectItem key={algo.value} value={algo.value}>
                        <div>
                          <div className="font-medium">{algo.label}</div>
                          <div className="text-xs text-gray-500">{algo.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Constraints */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Safety Constraints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries({
                maxHeight: 'Max Height',
                maxWeight: 'Max Weight',
                fragileProtection: 'Fragile Protection',
                hazmatSeparation: 'Hazmat Separation',
                deliverySequence: 'Delivery Sequence',
                temperatureZoning: 'Temperature Zones'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-xs">{label}</Label>
                  <Switch
                    checked={constraints[key as keyof typeof constraints]}
                    onCheckedChange={(checked) =>
                      setConstraints(prev => ({ ...prev, [key]: checked }))
                    }
                    className="scale-75"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cargo Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Cargo Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{cargoData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span className="font-medium">{cargoData.reduce((sum, item) => sum + item.weight_lbs, 0).toLocaleString()} lbs</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-medium">{cargoData.reduce((sum, item) => sum + (item.l * item.w * item.h), 0).toFixed(0)} ft³</span>
                </div>
                <div className="flex justify-between">
                  <span>Stackable:</span>
                  <span className="font-medium">{cargoData.filter(item => item.stackable).length}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadFromFile}
                className="w-full mt-2 h-7 text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Load from File
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualize" className="flex-1 overflow-hidden">
          <div className="h-full min-h-[200px]">
            <Trailer3D
              trailer={selectedTrailer}
              placedItems={result?.placed || []}
              showAxleLoads={true}
              showCenterOfGravity={true}
              showGrid={true}
              highlightedItem={null}
              onItemClick={(itemId) => {
                // Handle item click for highlighting
                console.log('Clicked item:', itemId);
              }}
              centerOfGravity={result ? {
                x: result.cog[0],
                y: result.cog[1],
                z: result.cog[2]
              } : undefined}
              warnings={warnings}
            />
          </div>
        </TabsContent>

        <TabsContent value="results" className="flex-1 space-y-2 overflow-y-auto">
          {result ? (
            <>
              {/* Warnings */}
              {warnings.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-3">
                    <div className="space-y-1">
                      {warnings.map((warning, index) => (
                        <div key={index} className={`flex items-center gap-2 text-xs ${warning.type === 'error' ? 'text-red-600' :
                          warning.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                          {warning.type === 'error' ? <AlertTriangle className="h-3 w-3" /> :
                            warning.type === 'warning' ? <AlertCircle className="h-3 w-3" /> :
                              <Info className="h-3 w-3" />}
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardContent className="pt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{metrics?.utilization}%</div>
                      <div className="text-xs text-gray-600">Volume Utilization</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{metrics?.weightUtilization}%</div>
                      <div className="text-xs text-gray-600">Weight Utilization</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{metrics?.stabilityScore}</div>
                      <div className="text-xs text-gray-600">Stability Score</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{metrics?.placed}</div>
                      <div className="text-xs text-gray-600">Items Placed</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Load Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Center of Gravity:</span>
                    <span className="font-mono">X:{metrics?.cogX}ft Y:{metrics?.cogY}ft Z:{metrics?.cogZ}ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Weight:</span>
                    <span className="font-medium">{metrics?.totalWeight?.toLocaleString()} lbs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Axle Load:</span>
                    <Badge variant={metrics?.maxAxleLoad && metrics.maxAxleLoad > 100 ? "destructive" : "outline"} className="text-xs">
                      {Math.round(metrics?.maxAxleLoad || 0)}%
                    </Badge>
                  </div>
                  {metrics && metrics.unplaced > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Unplaced Items:</span>
                      <span className="font-medium">{metrics.unplaced}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-600">No optimization results</p>
                <p className="text-xs text-gray-500">Run optimization to see results</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="exceptions" className="flex-1 space-y-2 overflow-y-auto">
          {exceptions.length > 0 ? (
            <>
              {/* Exception Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Exception Analysis ({exceptions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {exceptions.map((exception, index) => (
                    <div
                      key={exception.id}
                      className={`p-3 rounded-lg border-l-4 ${exception.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        exception.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                          exception.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-blue-500 bg-blue-50'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={exception.severity === 'critical' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {exception.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{exception.message}</span>
                          </div>
                          <p className="text-xs text-gray-600">{exception.suggestion}</p>
                          {exception.itemIds && exception.itemIds.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Affected items: </span>
                              <span className="text-xs font-mono">{exception.itemIds.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        {exception.autoFixable && (
                          <Button type="button" size="sm" variant="outline" className="h-6 text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto-Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Improvement Suggestions */}
              {suggestions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-green-800">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alternative Trailers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Alternative Trailers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ExceptionHandler.getAlternativeTrailers(selectedTrailer, exceptions).map((alt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">{alt.type}</span>
                          <p className="text-xs text-gray-600">{alt.reason}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alt.capacity.toLocaleString()} lbs
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="text-sm text-gray-600">No exceptions detected</p>
                <p className="text-xs text-gray-500">Load optimization looks good!</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="export" className="flex-1 space-y-2 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={!result}
                  className="h-8 text-xs"
                  variant="outline"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  HTML Report
                </Button>
                <Button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={!result}
                  className="h-8 text-xs"
                  variant="outline"
                >
                  <Download className="h-3 w-3 mr-1" />
                  CSV Data
                </Button>
                <Button
                  type="button"
                  onClick={handleExportJSON}
                  disabled={!result}
                  className="h-8 text-xs"
                  variant="outline"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  JSON API
                </Button>
              </div>
              {result && (
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• HTML: Complete report with diagrams and analysis</p>
                  <p>• CSV: Position data for WMS/ERP integration</p>
                  <p>• JSON: API-ready data for system integration</p>
                  <p>• All formats include placed and unplaced items</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




