# ERPNext Page Layout Analysis

**Date**: December 5, 2025  
**Analysis**: ERPNext Folder Structure & Layout System

---

## Executive Summary

ERPNext uses a **workspace-based navigation system** built on the **Frappe Framework** (Python backend + JavaScript frontend). The page layout is structured around **Workspace Sidebar JSON configurations** that define hierarchical navigation for each module.

---

## 🏗️ Architecture Overview

### Technology Stack
- **Backend**: Python (Frappe Framework)
- **Frontend**: JavaScript (Frappe UI - Vue-based)
- **Navigation**: Workspace Sidebar JSON configurations
- **UI Framework**: Frappe UI (Vue.js components)

### Key Concepts
1. **Workspace**: A module workspace (e.g., "Selling", "Buying", "Stock")
2. **Workspace Sidebar**: JSON configuration defining navigation items
3. **DocType**: Document types (forms, lists) in ERPNext
4. **Dashboard**: Analytics and KPI views
5. **Report**: Custom reports and queries

---

## 📁 File Structure

```
erpnext-develop/erpnext-develop/erpnext/
├── workspace_sidebar/          # Navigation configurations (JSON)
│   ├── home.json
│   ├── selling.json
│   ├── buying.json
│   ├── stock.json
│   ├── settings.json
│   ├── projects.json
│   └── ... (22 total workspaces)
├── public/                     # Frontend assets
│   ├── js/                     # JavaScript files
│   │   ├── controllers/        # Business logic controllers
│   │   ├── utils/              # Utility functions
│   │   ├── conf.js             # Configuration & breadcrumbs
│   │   └── erpnext.bundle.js   # Main bundle
│   ├── scss/                   # Stylesheets
│   └── images/                 # Icons, logos, images
└── [module]/                   # Module directories
    ├── doctype/                # Document types (forms)
    ├── report/                 # Reports
    ├── workspace/              # Workspace configurations
    └── page/                   # Custom pages
```

---

## 🎨 Page Layout Structure

### 1. Workspace-Based Navigation

Each module has a **Workspace Sidebar JSON file** that defines:
- Navigation items hierarchy
- Icons for each item
- Link types (DocType, Report, Dashboard, Workspace)
- Collapsible sections
- Indentation levels

### Example: Settings Workspace (`workspace_sidebar/settings.json`)

```json
{
  "app": "erpnext",
  "doctype": "Workspace Sidebar",
  "header_icon": "setting",
  "title": "Settings",
  "items": [
    {
      "icon": "home",
      "label": "Home",
      "link_to": "Settings",
      "link_type": "Workspace",
      "type": "Link"
    },
    {
      "icon": "crm",
      "label": "CRM Settings",
      "link_to": "CRM Settings",
      "link_type": "DocType",
      "type": "Link"
    },
    {
      "icon": "sell",
      "label": "Selling Settings",
      "link_to": "Selling Settings",
      "link_type": "DocType",
      "type": "Link"
    }
    // ... more items
  ]
}
```

### 2. Navigation Item Types

| Type | Purpose | Example |
|------|---------|---------|
| **DocType** | Form/list view | "Sales Order", "Purchase Order" |
| **Workspace** | Module workspace | "Selling", "Buying" |
| **Dashboard** | Analytics/KPI view | "Asset Dashboard" |
| **Report** | Custom reports | "Project Summary" |
| **Section Break** | Visual separator | "Reports", "Maintenance" |

### 3. Layout Components

#### A. Sidebar Navigation
- **Left sidebar**: Workspace navigation (collapsible)
- **Hierarchical structure**: Parent → Child items
- **Icons**: Visual indicators for each item
- **Active state**: Highlighted current page

#### B. Main Content Area
- **DocType forms**: Standard form layout (fields, buttons, actions)
- **List views**: Table with filters, search, pagination
- **Dashboards**: KPI cards, charts, widgets
- **Reports**: Data tables with export options

#### C. Top Header
- **Breadcrumbs**: Navigation path (e.g., Selling > Sales Order)
- **Search**: Global search bar
- **Notifications**: System alerts
- **User menu**: Profile, settings, logout

---

## 📊 Workspace Examples

### 1. Selling Workspace Structure

```
Selling (Workspace)
├── Home (Workspace link)
├── Dashboard
├── Sales Order (DocType)
├── Quotation (DocType)
├── Sales Invoice (DocType)
├── Customer (DocType)
├── Section: Reports
│   ├── Sales Analytics
│   └── Item-wise Sales History
└── Section: Setup
    └── Sales Person
```

### 2. Stock Workspace Structure

```
Stock (Workspace)
├── Home (Workspace link)
├── Dashboard
├── Stock Entry (DocType)
├── Material Request (DocType)
├── Item (DocType)
├── Warehouse (DocType)
├── Section: Reports
│   ├── Stock Balance
│   └── Item Price List
└── Section: Setup
    └── Stock Settings
```

### 3. Settings Workspace Structure

```
Settings (Workspace)
├── Home
├── CRM Settings
├── Selling Settings
├── Buying Settings
├── Accounts Settings
├── Stock Settings
├── Manufacturing Settings
├── Print Settings
├── System Settings
└── Global Defaults
```

---

## 🎯 Key Layout Patterns

### Pattern 1: Standard Form Layout
```
┌─────────────────────────────────────────┐
│ Breadcrumbs: Module > DocType          │
├─────────────────────────────────────────┤
│ [Save] [Submit] [Cancel]  [Actions ▼]  │
├─────────────────────────────────────────┤
│                                         │
│ Field 1: [input]                       │
│ Field 2: [select]                      │
│ Field 3: [date picker]                 │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ Child Table                       │ │
│ │ Row 1, Row 2, ...                 │ │
│ └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Pattern 2: List View Layout
```
┌─────────────────────────────────────────┐
│ Breadcrumbs: Module > List             │
├─────────────────────────────────────────┤
│ [Filters] [Search] [New] [Actions ▼]   │
├─────────────────────────────────────────┤
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ Column 1 │ Column 2 │ Column 3   │ │
│ ├───────────────────────────────────┤ │
│ │ Row 1                             │ │
│ │ Row 2                             │ │
│ │ ...                               │ │
│ └───────────────────────────────────┘ │
│                                         │
│ [Pagination: 1 2 3 ...]                │
└─────────────────────────────────────────┘
```

### Pattern 3: Dashboard Layout
```
┌─────────────────────────────────────────┐
│ Breadcrumbs: Module > Dashboard        │
├─────────────────────────────────────────┤
│                                         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │  │
│ │ Card │ │ Card │ │ Card │ │ Card │  │
│ └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│ ┌──────────────────┐ ┌──────────────┐  │
│ │                  │ │              │  │
│ │   Chart 1        │ │   Chart 2    │  │
│ │                  │ │              │  │
│ └──────────────────┘ └──────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuration Files

### 1. Workspace Sidebar JSON Structure

```json
{
  "app": "erpnext",
  "doctype": "Workspace Sidebar",
  "header_icon": "icon-name",
  "title": "Workspace Title",
  "items": [
    {
      "icon": "icon-name",
      "label": "Display Label",
      "link_to": "DocType or Workspace Name",
      "link_type": "DocType | Workspace | Dashboard | Report",
      "type": "Link | Section Break",
      "indent": 0 | 1,
      "child": 0 | 1,
      "collapsible": 0 | 1
    }
  ]
}
```

### 2. Breadcrumb Configuration (`public/js/conf.js`)

```javascript
// Preferred modules for breadcrumbs
frappe.breadcrumbs.preferred = {
  "Item Group": "Stock",
  "Customer Group": "Selling",
  "Supplier Group": "Buying",
  "Territory": "Selling"
}

// Module mapping
frappe.breadcrumbs.module_map = {
  "ERPNext Integrations": "Integrations",
  "Geo": "Settings",
  "Portal": "Website"
}
```

---

## 📋 Available Workspaces (22 Total)

1. **Home** - Quick access to common items
2. **Selling** - Sales orders, quotations, customers
3. **Buying** - Purchase orders, suppliers
4. **Stock** - Inventory, warehouses, items
5. **Manufacturing** - Work orders, BOM, production
6. **Accounts** - Accounting, invoices, payments
7. **Projects** - Project management, tasks
8. **CRM** - Customer relationship management
9. **Assets** - Asset management
10. **Support** - Help desk, tickets
11. **Quality** - Quality management
12. **Utilities** - Utilities and tools
13. **HR** - Human resources
14. **Payroll** - Payroll management
15. **Healthcare** - Healthcare modules
16. **Education** - Education modules
17. **Non Profit** - Non-profit features
18. **Agriculture** - Agriculture management
19. **Hotels** - Hotel management
20. **Retail** - Point of sale, retail
21. **Subscription** - Subscription management
22. **Settings** - System configuration

---

## 🎨 UI Components & Styling

### JavaScript Files
- **`erpnext.bundle.js`**: Main ERPNext bundle
- **`controllers/`**: Business logic (accounts.js, buying.js, stock_controller.js)
- **`utils/`**: Utility functions (party.js, item_selector.js)
- **`conf.js`**: Configuration and breadcrumbs

### Stylesheets
- **`erpnext.bundle.scss`**: Main styles
- **`erpnext.scss`**: Core styles
- **`point-of-sale.scss`**: POS-specific styles
- **`website.scss`**: Website/public pages

### Icons & Images
- **Desktop icons**: SVG icons for workspace modules
- **Images**: Logos, illustrations, UI states

---

## 🔄 Comparison: ERPNext vs StarPath Layout

| Aspect | ERPNext | StarPath (Current) |
|--------|---------|-------------------|
| **Framework** | Frappe (Python + Vue) | Next.js (React) |
| **Navigation** | Workspace sidebar (JSON config) | React sidebar component |
| **Layout Type** | Form-based (DocType) | Module-based (TMS/WMS) |
| **Page Structure** | Standard form/list/dashboard | Custom quadrant layouts |
| **Styling** | Frappe UI (Vue) | Tailwind CSS + Shadcn/ui |
| **Configuration** | JSON files | TypeScript/TSX components |

### Key Differences

1. **ERPNext**: Form-centric, workspace-based navigation
2. **StarPath**: Module-centric, custom layouts (2-quadrant, 3-quadrant)

---

## 💡 Insights for StarPath Integration

### What We Can Learn

1. **Hierarchical Navigation**: ERPNext's nested workspace structure could inspire better organization
2. **Workspace Concept**: Grouping related features together (like TMS/WMS modules)
3. **Configuration-Driven**: JSON-based navigation could make it easier to customize
4. **Breadcrumbs**: Clear navigation path showing current location

### Adaptation Opportunities

1. **Workspace-Style Sidebar**: Could enhance current sidebar with nested sections
2. **Breadcrumb System**: Add breadcrumbs to show navigation path
3. **Module Grouping**: Group TMS/WMS features into clear workspaces
4. **Icon System**: Standardize icon usage across modules

---

## 📌 Key Takeaways

1. ✅ **ERPNext uses workspace-based navigation** with JSON configuration files
2. ✅ **Each module has a workspace sidebar** defining its navigation structure
3. ✅ **Layout is form-centric** (DocType forms, lists, dashboards)
4. ✅ **Built on Frappe Framework** (Python + Vue.js)
5. ✅ **22 different workspaces** covering various business functions
6. ✅ **Hierarchical navigation** with collapsible sections
7. ✅ **Configuration-driven** approach for easy customization

---

## 🎯 Recommendations for StarPath

1. **Adopt Workspace Concept**: Create workspace configurations for TMS and WMS
2. **Enhance Navigation**: Add nested dropdowns similar to ERPNext's hierarchy
3. **Add Breadcrumbs**: Show clear navigation path (TMS > Orders > Order Details)
4. **Standardize Icons**: Use consistent icon system across modules
5. **Configuration Files**: Consider JSON configs for navigation structure

---

**Status**: ✅ Analysis Complete  
**Next Steps**: Consider implementing workspace-style navigation in StarPath for better organization

