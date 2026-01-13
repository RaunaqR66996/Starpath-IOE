import type { WorkspaceConfig } from '@/lib/workspace/workspace-config'

export const wmsWorkspaceConfig: WorkspaceConfig = {
  app: "blueship",
  doctype: "Workspace Sidebar",
  header_icon: "warehouse",
  title: "Warehouse Management",
  module: "WMS",
  name: "WMS",
  items: [
    {
      child: 0,
      collapsible: 1,
      icon: "home",
      indent: 0,
      label: "Home",
      link_to: "WMS",
      link_type: "Workspace",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "chart",
      indent: 0,
      label: "Dashboard",
      link_to: "WMS Dashboard",
      link_type: "Dashboard",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "warehouse",
      indent: 0,
      label: "Warehouse",
      link_to: "Warehouse",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "package",
      indent: 0,
      label: "ASN",
      link_to: "ASN",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "package",
      indent: 0,
      label: "Receiving",
      link_to: "Receiving",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "checklist",
      indent: 0,
      label: "Quality Control",
      link_to: "QC",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "arrow-down",
      indent: 0,
      label: "Putaway",
      link_to: "Putaway",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "notebook-tabs",
      indent: 0,
      label: "Inventory",
      link_to: "Inventory",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "waves",
      indent: 0,
      label: "Wave Planning",
      link_to: "Wave",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "hand",
      indent: 0,
      label: "Picking",
      link_to: "Picking",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "box",
      indent: 0,
      label: "Packing",
      link_to: "Packing",
      link_type: "DocType",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "truck",
      indent: 0,
      label: "Shipping",
      link_to: "Shipping",
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
      label: "Inventory Report",
      link_to: "Inventory Report",
      link_type: "Report",
      type: "Link"
    },
    {
      child: 1,
      collapsible: 1,
      indent: 0,
      label: "Warehouse Analytics",
      link_to: "Warehouse Analytics",
      link_type: "Report",
      type: "Link"
    },
    {
      child: 1,
      collapsible: 1,
      indent: 0,
      label: "Productivity Report",
      link_to: "Productivity Report",
      link_type: "Report",
      type: "Link"
    },
    {
      child: 0,
      collapsible: 1,
      icon: "settings",
      indent: 0,
      label: "Settings",
      link_to: "WMS Settings",
      link_type: "DocType",
      type: "Link"
    }
  ]
}

