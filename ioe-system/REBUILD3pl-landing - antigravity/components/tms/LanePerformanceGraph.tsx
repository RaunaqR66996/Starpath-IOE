'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  MapPin, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Route,
  Package,
  DollarSign,
  Fuel,
  Activity
} from 'lucide-react';

interface LaneData {
  id: string;
  name: string;
  warehouse: string;
  warehouseLocation: string;
  distance: number; // miles
  avgTransitTime: number; // hours
  onTimeDelivery: number; // percentage
  costPerMile: number; // dollars
  fuelEfficiency: number; // mpg
  utilization: number; // percentage
  status: 'active' | 'delayed' | 'completed' | 'scheduled';
  currentTrucks: number;
  totalShipments: number;
  revenue: number;
  lastUpdate: string;
}

interface LanePerformanceGraphProps {
  className?: string;
}

// Professional lane data for 3 strategic warehouse corridors
const MOCK_LANE_DATA: LaneData[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API;

export function LanePerformanceGraph({ className }: LanePerformanceGraphProps) {
  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const laneData = useMemo(() => MOCK_LANE_DATA, []);
  
  const totalTrucks = laneData.reduce((sum, lane) => sum + lane.currentTrucks, 0);
  const totalShipments = laneData.reduce((sum, lane) => sum + lane.totalShipments, 0);
  const avgOnTimeDelivery = laneData.reduce((sum, lane) => sum + lane.onTimeDelivery, 0) / laneData.length;
  const totalRevenue = laneData.reduce((sum, lane) => sum + lane.revenue, 0);

  const getStatusColor = (status: LaneData['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'delayed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (value: number, type: 'delivery' | 'utilization' | 'efficiency') => {
    if (type === 'delivery') {
      return value >= 95 ? 'text-green-600' : value >= 85 ? 'text-yellow-600' : 'text-red-600';
    }
    if (type === 'utilization') {
      return value >= 90 ? 'text-green-600' : value >= 75 ? 'text-yellow-600' : 'text-red-600';
    }
    if (type === 'efficiency') {
      return value >= 6.5 ? 'text-green-600' : value >= 6.0 ? 'text-yellow-600' : 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className={`space-y-2 ${className} overflow-hidden`}>
      {/* Executive Dashboard Header */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                <Route className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Strategic Lane Analytics
                </CardTitle>
                <p className="text-sm text-slate-600 font-medium">
                  Real-time performance across 3 distribution corridors
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? "default" : "outline"}
                  onClick={() => setTimeRange(range)}
                  className={`h-7 text-xs font-medium ${
                    timeRange === range 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {range === '24h' ? 'Live' : range === '7d' ? 'Weekly' : 'Monthly'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">{totalTrucks}</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Active Fleet</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{totalShipments}</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Total Volume</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-purple-600 mb-1">{avgOnTimeDelivery.toFixed(1)}%</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Service Level</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-amber-600 mb-1">${(totalRevenue / 1000).toFixed(0)}K</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Lane Cards */}
      <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-96">
        {laneData.map((lane) => (
          <Card 
            key={lane.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 ${
              selectedLane === lane.id 
                ? 'ring-2 ring-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-500' 
                : 'border-l-slate-300 hover:border-l-blue-400'
            }`}
            onClick={() => setSelectedLane(selectedLane === lane.id ? null : lane.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    lane.status === 'active' ? 'bg-gradient-to-br from-emerald-100 to-green-100' :
                    lane.status === 'delayed' ? 'bg-gradient-to-br from-amber-100 to-orange-100' :
                    'bg-gradient-to-br from-slate-100 to-gray-100'
                  }`}>
                    <Truck className={`h-5 w-5 ${
                      lane.status === 'active' ? 'text-emerald-600' :
                      lane.status === 'delayed' ? 'text-amber-600' :
                      'text-slate-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800">{lane.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{lane.warehouse}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs font-semibold px-3 py-1 ${getStatusColor(lane.status)}`}>
                    {lane.status === 'active' ? 'OPERATIONAL' : 
                     lane.status === 'delayed' ? 'DELAYED' : 
                     lane.status === 'completed' ? 'COMPLETED' : 'SCHEDULED'}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700">{lane.currentTrucks}</div>
                    <div className="text-xs text-slate-500">Active Units</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className={`text-lg font-bold mb-1 ${getPerformanceColor(lane.onTimeDelivery, 'delivery')}`}>
                    {lane.onTimeDelivery}%
                  </div>
                  <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Service Level</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className={`text-lg font-bold mb-1 ${getPerformanceColor(lane.utilization, 'utilization')}`}>
                    {lane.utilization}%
                  </div>
                  <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Capacity</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className={`text-lg font-bold mb-1 ${getPerformanceColor(lane.fuelEfficiency, 'efficiency')}`}>
                    {lane.fuelEfficiency}
                  </div>
                  <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">MPG</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-lg font-bold mb-1 text-slate-700">
                    {lane.avgTransitTime}h
                  </div>
                  <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Transit</div>
                </div>
              </div>

              {/* Route Intelligence */}
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded">
                        <Route className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700">{lane.distance} mi</div>
                        <div className="text-xs text-slate-500">Distance</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded">
                        <DollarSign className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700">${lane.costPerMile}</div>
                        <div className="text-xs text-slate-500">Per Mile</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded">
                        <Package className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700">{lane.totalShipments}</div>
                        <div className="text-xs text-slate-500">Shipments</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-500">Last Updated</div>
                    <div className="text-sm font-semibold text-slate-700">{lane.lastUpdate}</div>
                  </div>
                </div>
              </div>

              {/* Executive Intelligence Panel */}
              {selectedLane === lane.id && (
                <div className="mt-3 pt-3 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <h4 className="font-bold text-slate-800">Performance Intelligence</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-600">30-Day Revenue</span>
                          <span className="font-bold text-emerald-600">${lane.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-600">Avg Load Weight</span>
                          <span className="font-bold text-slate-700">24,500 lbs</span>
                        </div>
                        <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-600">Driver Rating</span>
                          <span className="font-bold text-amber-600">4.8/5.0 ⭐</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        <h4 className="font-bold text-slate-800">Operational Status</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-600">Active Fleet</span>
                          <span className="font-bold text-blue-600">{lane.currentTrucks} Units</span>
                        </div>
                        <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-600">Next Departure</span>
                          <span className="font-bold text-slate-700">2:30 PM</span>
                        </div>
                        <div className="flex justify-between items-center p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-600">Weather Impact</span>
                          <span className="font-bold text-emerald-600">Clear ✅</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
