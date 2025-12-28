import type { WorkspaceConfig } from '@/lib/workspace/workspace-config'

export const tmsWorkspaceConfig: WorkspaceConfig = {
  app: "blueship",
  doctype: "Workspace Sidebar",
  header_icon: "truck",
  title: "Transportation Management",
  module: "TMS",
  name: "TMS",
  items: [
    {
      child: 0,
      collapsible: 1,
      icon: "home",
      indent: 0,
      label: "Home",
      link_to: "TMS",
      link_type: "Workspace",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "chart",
      indent: 0,
      label: "Dashboard",
      link_to: "TMS Dashboard",
      link_type: "Dashboard",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "package",
      indent: 0,
      label: "Shipment",
      link_to: "Shipment",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "notebook-tabs",
      indent: 0,
      label: "Order",
      link_to: "Order",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "truck",
      indent: 0,
      label: "Carrier",
      link_to: "Carrier",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "map",
      indent: 0,
      label: "Load Planning",
      link_to: "Load Plan",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "dollar",
      indent: 0,
      label: "Rate Quote",
      link_to: "Rate Quote",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "map-pin",
      indent: 0,
      label: "Tracking Event",
      link_to: "Tracking Event",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "notepad-text",
      indent: 1,
      keep_closed: 1,
      label: "Reports",
      link_type: "DocType",
      type: "Section Break"
    },
    {
      child: 1,
      collapsible: 1,
      indent: 0,
      label: "Shipment Analytics",
      link_to: "Shipment Analytics",
      link_type: "Report",
      type: "Link"
    },
    {
      child: 1,
      collapsible: 1,
      indent: 0,
      label: "Carrier Performance",
      link_to: "Carrier Performance",
      link_type: "Report",
      type: "Link"
    },
    {
      child: 1,
      collapsible: 1,
      indent: 0,
      label: "Cost Analysis",
      link_to: "Cost Analysis",
      link_type: "Report",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "settings",
      indent: 0,
      label: "Settings",
      link_to: "TMS Settings",
      link_type: "DocType",
      type: "Link"
    }
  ]
}

