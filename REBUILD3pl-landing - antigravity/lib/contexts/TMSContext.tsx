"use client"

import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// TMS Module Types
export type TMSModule =
  | 'dashboard'
  | 'orders'
  | 'staged-orders'
  | 'load-planning'
  | 'carriers'
  | 'rates'
  | 'tracking'
  | 'documents'
  | 'audit'
  | 'analytics'
  | 'exceptions'
  | 'settings'
  | 'invoices'

// TMS State Interface
export interface TMSState {
  currentModule: TMSModule
  selectedOrder: string | null
  selectedShipment: string | null
  selectedCarrier: string | null
  loadOptimizationResult: any | null
  trackingData: any[]
  notifications: Notification[]
  isLoading: boolean
  error: string | null
}

// Action Types
export type TMSAction =
  | { type: 'SET_MODULE'; payload: TMSModule }
  | { type: 'SET_SELECTED_ORDER'; payload: string | null }
  | { type: 'SET_SELECTED_SHIPMENT'; payload: string | null }
  | { type: 'SET_SELECTED_CARRIER'; payload: string | null }
  | { type: 'SET_LOAD_OPTIMIZATION_RESULT'; payload: any | null }
  | { type: 'SET_TRACKING_DATA'; payload: any[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// Notification Interface
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// Initial State
const initialState: TMSState = {
  currentModule: 'dashboard',
  selectedOrder: null,
  selectedShipment: null,
  selectedCarrier: null,
  loadOptimizationResult: null,
  trackingData: [],
  notifications: [],
  isLoading: false,
  error: null
}

// Reducer
function tmsReducer(state: TMSState, action: TMSAction): TMSState {
  switch (action.type) {
    case 'SET_MODULE':
      return { ...state, currentModule: action.payload, error: null }

    case 'SET_SELECTED_ORDER':
      return { ...state, selectedOrder: action.payload }

    case 'SET_SELECTED_SHIPMENT':
      return { ...state, selectedShipment: action.payload }

    case 'SET_SELECTED_CARRIER':
      return { ...state, selectedCarrier: action.payload }

    case 'SET_LOAD_OPTIMIZATION_RESULT':
      return { ...state, loadOptimizationResult: action.payload }

    case 'SET_TRACKING_DATA':
      return { ...state, trackingData: action.payload }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50) // Keep last 50
      }

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    default:
      return state
  }
}

// Context
const TMSContext = createContext<{
  state: TMSState
  dispatch: React.Dispatch<TMSAction>
  setModule: (module: TMSModule) => void
  setSelectedOrder: (orderId: string | null) => void
  setSelectedShipment: (shipmentId: string | null) => void
  setSelectedCarrier: (carrierId: string | null) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
} | null>(null)

// Provider Component
export function TMSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tmsReducer, initialState)

  const setModule = (module: TMSModule) => {
    dispatch({ type: 'SET_MODULE', payload: module })
  }

  const setSelectedOrder = (orderId: string | null) => {
    dispatch({ type: 'SET_SELECTED_ORDER', payload: orderId })
  }

  const setSelectedShipment = (shipmentId: string | null) => {
    dispatch({ type: 'SET_SELECTED_SHIPMENT', payload: shipmentId })
  }

  const setSelectedCarrier = (carrierId: string | null) => {
    dispatch({ type: 'SET_SELECTED_CARRIER', payload: carrierId })
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })
  }

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  return (
    <TMSContext.Provider value={{
      state,
      dispatch,
      setModule,
      setSelectedOrder,
      setSelectedShipment,
      setSelectedCarrier,
      addNotification,
      removeNotification,
      setLoading,
      setError
    }}>
      {children}
    </TMSContext.Provider>
  )
}

// Hook to use TMS context
export function useTMS() {
  const context = useContext(TMSContext)
  if (!context) {
    throw new Error('useTMS must be used within a TMSProvider')
  }
  return context
}

// Module configuration
export const TMS_MODULES = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'Real-time TMS metrics and KPIs',
    icon: 'dashboard'
  },
  orders: {
    title: 'Orders & Shipments Management',
    description: 'Manage orders, shipments, and customer information',
    icon: 'package'
  },
  'load-planning': {
    title: 'Load Planning & Optimization',
    description: 'AI-powered load planning and 3D optimization',
    icon: 'truck-delivery'
  },
  carriers: {
    title: 'Carrier Management',
    description: 'Manage carrier relationships and performance',
    icon: 'users'
  },
  rates: {
    title: 'Rate Quotes & Tendering',
    description: 'Get quotes, compare rates, and manage tenders',
    icon: 'currency-dollar'
  },
  tracking: {
    title: 'Tracking & Visibility',
    description: 'Real-time shipment tracking and visibility',
    icon: 'eye'
  },
  documents: {
    title: 'Document Center',
    description: 'BOL, packing lists, customs forms, and labels',
    icon: 'file-text'
  },
  audit: {
    title: 'Freight Audit & Billing',
    description: 'Audit freight bills and manage billing',
    icon: 'receipt'
  },
  analytics: {
    title: 'Analytics & Reports',
    description: 'Performance analytics and reporting',
    icon: 'report-analytics'
  },
  exceptions: {
    title: 'Exception Handling',
    description: 'Manage exceptions and alerts',
    icon: 'exclamation-mark'
  },
  settings: {
    title: 'System Settings',
    description: 'Configure TMS system settings',
    icon: 'settings'
  },
  invoices: {
    title: 'Invoices & Billing',
    description: 'Manage customer invoices and payments',
    icon: 'receipt-2'
  }
} as const





