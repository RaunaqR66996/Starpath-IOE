"use client";

import React, { useState } from "react";
import { TopMenu } from "@/components/ioe/TopMenu";
import { ActivityBar } from "@/components/ioe/ActivityBar";
import { Sidebar } from "@/components/ioe/Sidebar";
import { EditorTabs } from "@/components/ioe/EditorTabs";
import { RightCopilot } from "@/components/ioe/RightCopilot";
// import { BottomPanel } from "@/components/ioe/BottomPanel";
import { OpsEditor } from "@/components/ioe/OpsEditor";
import { PlanningEditorTabs } from "@/components/ioe/planning/PlanningEditorTabs";
import { InventoryWorkspace } from "@/components/ioe/inventory/InventoryWorkspace";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/ui-store";

export default function IOEPage() {
  // Panel States
  const [selectedActivity, setSelectedActivity] = useState("explorer");
  // const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const { sidebarOpen, rightPanelOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  // const [bottomPanelOpen, setBottomPanelOpen] = useState(true);

  // Tab States
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("");

  // Site States (Warehouse Selection)
  const [activeSite, setActiveSite] = useState("Kuehne Nagel East");

  // Planning States
  const [selectedPlanningNode, setSelectedPlanningNode] = useState<string | null>(null);
  const [planningTabs, setPlanningTabs] = useState<Array<{ id: string; label: string; closable?: boolean }>>([]);
  const [activePlanningTab, setActivePlanningTab] = useState<string | null>(null);

  // Global Layers State
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  const [activeHeatmapMetric, setActiveHeatmapMetric] = useState<'density' | 'occupancy'>('density');
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.4);

  const handlePlanningNodeSelect = (nodeId: string) => {
    setSelectedPlanningNode(nodeId);
    // Open tab if not already open
    if (!planningTabs.find(t => t.id === nodeId)) {
      const label = nodeId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      setPlanningTabs(prev => [...prev, { id: nodeId, label, closable: true }]);
    }
    setActivePlanningTab(nodeId);
  };

  const closePlanningTab = (tabId: string) => {
    const newTabs = planningTabs.filter(t => t.id !== tabId);
    setPlanningTabs(newTabs);
    if (activePlanningTab === tabId) {
      setActivePlanningTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  const closeTab = (tabName: string) => {
    const newTabs = tabs.filter((t) => t !== tabName);
    setTabs(newTabs);
    if (activeTab === tabName) {
      setActiveTab(newTabs.length > 0 ? newTabs[0] : "");
    }
  };

  const openOrderTab = (orderId: string) => {
    const tabName = `Order-${orderId}`;
    if (!tabs.includes(tabName)) {
      setTabs([...tabs, tabName]);
    }
    setActiveTab(tabName);
  };

  const openShipmentTab = (shipmentId: string) => {
    const tabName = `Shipment-${shipmentId}`;
    if (!tabs.includes(tabName)) {
      setTabs([...tabs, tabName]);
    }
    setActiveTab(tabName);
  };

  const openTab = (tabId: string) => {
    if (!tabs.includes(tabId)) {
      setTabs([...tabs, tabId]);
    }
    setActiveTab(tabId);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white selection:bg-neutral-800">
      {/* 1. Top Menubar */}
      <TopMenu />

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Left Activity Bar */}
        <ActivityBar
          selectedActivity={selectedActivity}
          onSelect={(id) => {
            if (selectedActivity === id) {
              toggleSidebar();
            } else {
              setSelectedActivity(id);
              setSidebarOpen(true);
            }
          }}
        />

        {/* 3. Left Sidebar Panel */}
        {
          sidebarOpen && selectedActivity !== "ops" && (
            <Sidebar
              selectedActivity={selectedActivity}
              activeSite={activeSite}
              onSelectSite={setActiveSite}
              activeTab={activeTab}
              onSelectTab={openTab}
              selectedPlanningNode={selectedPlanningNode}
              onSelectPlanningNode={handlePlanningNodeSelect}
              isHeatmapActive={isHeatmapActive}
              onToggleHeatmap={() => setIsHeatmapActive(!isHeatmapActive)}
              heatmapMetric={activeHeatmapMetric}
              onSelectHeatmapMetric={setActiveHeatmapMetric}
            />
          )
        }

        {/* Main Workspace Area (Center) */}
        <div className="flex flex-1 overflow-hidden bg-black border-l border-neutral-800">
          {/* 4. Center Editor Area */}
          <div className="flex-1 overflow-hidden">
            {selectedActivity === "explorer" && (
              <EditorTabs
                tabs={tabs}
                activeTab={activeTab}
                activeSite={activeSite}
                onSelectTab={setActiveTab}
                onCloseTab={closeTab}
                onOrderClick={openOrderTab}
                onShipmentClick={openShipmentTab}
                isHeatmapActive={isHeatmapActive}
                heatmapMetric={activeHeatmapMetric}
                heatmapOpacity={heatmapOpacity}
                onHeatmapOpacityChange={setHeatmapOpacity}
              />
            )}

            {/* Ops Editor Panel */}
            {selectedActivity === "ops" && (
              <OpsEditor />
            )}

            {/* Planning Workspace */}
            {selectedActivity === "planning" && (
              <PlanningEditorTabs
                tabs={planningTabs}
                activeTab={activePlanningTab}
                onSelectTab={setActivePlanningTab}
                onCloseTab={closePlanningTab}
              />
            )}

            {/* Inventory Workspace with 3D Warehouse */}
            {selectedActivity === "inventory" && (
              <InventoryWorkspace activeSite={activeSite} />
            )}
          </div>

          {/* 5. Right AI Copilot - Universal for all activities */}
          {rightPanelOpen && (
            <RightCopilot
              activeSite={activeSite}
              activeTab={selectedActivity === 'planning' ? (activePlanningTab || 'Planning') : activeTab}
              selectedActivity={selectedActivity}
              onOpenTab={(tabId) => {
                const MAIN_VIEWS = [
                  "Orders", "Customers", "Inventory", "Shipments", "Procurement", "Finance", "Sustainability",
                  "CostMgmt", "HR", "TimeAtt", "SCM", "Production", "ProductionPlanning", "PLM", "CRM", "Sales", "Project", "Service", "GRC", "Admin", "Purchase", "Items", "JobTraveler", // ERP
                  "TransportPlanning", "Route Planning", "Carrier", "FreightAudit", "Yard", // TMS
                  "Receiving", "Picking", "Shipping", "Labor", "Control Tower" // WMS & Other
                ];

                // 1. Check if it's a Main Explorer View
                if (MAIN_VIEWS.includes(tabId)) {
                  setSelectedActivity('explorer');
                  if (!tabs.includes(tabId)) {
                    setTabs([...tabs, tabId]);
                  }
                  setActiveTab(tabId);
                  return;
                }

                // 2. Check if it's a Planning Node (contains hyphen typically)
                if (tabId.includes('-') || tabId === 'ai-autopilot') {
                  setSelectedActivity('planning');
                  handlePlanningNodeSelect(tabId);
                  return;
                }

                // 3. Fallback: If currently in planning, try planning node
                if (selectedActivity === 'planning') {
                  handlePlanningNodeSelect(tabId);
                } else {
                  // Default to Explorer tab
                  if (!tabs.includes(tabId)) {
                    setTabs([...tabs, tabId]);
                  }
                  setActiveTab(tabId);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Status Bar Placeholder */}
      {/* Status Bar Placeholder */}
      <footer className="hidden h-6 w-full items-center border-t border-neutral-800 bg-black px-3 text-[10px] text-neutral-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Central Node ({activeSite})
          </span>
          <span>Main Service</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span>UTF-8</span>
          <span>Next.js 16 (IDE Mode)</span>
        </div>
      </footer>
    </div>
  );
}
