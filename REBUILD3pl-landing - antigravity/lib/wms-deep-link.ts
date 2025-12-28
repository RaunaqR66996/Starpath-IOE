// WMS Deep Linking Utilities

import { useState, useEffect, useMemo } from 'react'

export interface DeepLinkParams {
  siteId?: string
  sku?: string
  binId?: string
  huId?: string
  lot?: string
  orderId?: string
  shipmentId?: string
  view?: 'inventory' | 'tasks' | 'layout'
  tab?: string
}

export class WMSDeepLink {
  private static readonly PREFIX = '/wms'

  /**
   * Generate a deep link URL for WMS
   */
  static generateUrl(params: DeepLinkParams): string {
    const url = new URL(window.location.origin + this.PREFIX)
    
    if (params.siteId) url.searchParams.set('site', params.siteId)
    if (params.sku) url.searchParams.set('sku', params.sku)
    if (params.binId) url.searchParams.set('bin', params.binId)
    if (params.huId) url.searchParams.set('hu', params.huId)
    if (params.lot) url.searchParams.set('lot', params.lot)
    if (params.orderId) url.searchParams.set('order', params.orderId)
    if (params.shipmentId) url.searchParams.set('shipment', params.shipmentId)
    if (params.view) url.searchParams.set('view', params.view)
    if (params.tab) url.searchParams.set('tab', params.tab)

    return url.toString()
  }

  /**
   * Parse deep link parameters from URL
   */
  static parseUrl(url?: string): DeepLinkParams {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {}
    }
    
    const targetUrl = url || window.location.href
    const urlObj = new URL(targetUrl)
    
    const params: DeepLinkParams = {}
    
    if (urlObj.searchParams.has('site')) {
      params.siteId = urlObj.searchParams.get('site')!
    }
    if (urlObj.searchParams.has('sku')) {
      params.sku = urlObj.searchParams.get('sku')!
    }
    if (urlObj.searchParams.has('bin')) {
      params.binId = urlObj.searchParams.get('bin')!
    }
    if (urlObj.searchParams.has('hu')) {
      params.huId = urlObj.searchParams.get('hu')!
    }
    if (urlObj.searchParams.has('lot')) {
      params.lot = urlObj.searchParams.get('lot')!
    }
    if (urlObj.searchParams.has('order')) {
      params.orderId = urlObj.searchParams.get('order')!
    }
    if (urlObj.searchParams.has('shipment')) {
      params.shipmentId = urlObj.searchParams.get('shipment')!
    }
    if (urlObj.searchParams.has('view')) {
      params.view = urlObj.searchParams.get('view') as DeepLinkParams['view']
    }
    if (urlObj.searchParams.has('tab')) {
      params.tab = urlObj.searchParams.get('tab')!
    }

    return params
  }

  /**
   * Update URL with new parameters without page reload
   */
  static updateUrl(params: DeepLinkParams, replace = false): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }
    
    const newUrl = this.generateUrl(params)
    
    if (replace) {
      window.history.replaceState({}, '', newUrl)
    } else {
      window.history.pushState({}, '', newUrl)
    }
  }

  /**
   * Clear all deep link parameters
   */
  static clearUrl(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }
    
    const url = new URL(window.location.href)
    url.pathname = this.PREFIX
    url.search = ''
    window.history.replaceState({}, '', url.toString())
  }

  /**
   * Check if current URL has deep link parameters
   */
  static hasDeepLink(): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false
    }
    
    const params = this.parseUrl()
    return Object.keys(params).length > 0
  }

  /**
   * Generate shareable link for current state
   */
  static generateShareLink(params: DeepLinkParams): string {
    return this.generateUrl(params)
  }

  /**
   * Copy current URL to clipboard
   */
  static async copyCurrentUrl(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  /**
   * Generate QR code data URL for current state
   */
  static generateQRCodeData(params: DeepLinkParams): string {
    const url = this.generateUrl(params)
    // This would typically use a QR code library
    // For now, return the URL as data
    return `data:text/plain;charset=utf-8,${encodeURIComponent(url)}`
  }
}

// React hook for deep linking
export function useWMSDeepLink() {
  // Only parse URL on client side
  const [params, setParams] = useState<DeepLinkParams>({})
  const [hasDeepLink, setHasDeepLink] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const parsedParams = WMSDeepLink.parseUrl()
      setParams(parsedParams)
      setHasDeepLink(WMSDeepLink.hasDeepLink())
    }
  }, [])
  
  // Memoize params to prevent infinite loops
  const memoizedParams = useMemo(() => params, [
    params.siteId,
    params.sku,
    params.binId,
    params.huId,
    params.lot,
    params.orderId,
    params.shipmentId,
    params.view,
    params.tab
  ])
  
  const updateParams = (newParams: Partial<DeepLinkParams>, replace = false) => {
    WMSDeepLink.updateUrl({ ...params, ...newParams }, replace)
    // Update local state
    setParams({ ...params, ...newParams })
  }

  const clearParams = () => {
    WMSDeepLink.clearUrl()
    setParams({})
    setHasDeepLink(false)
  }

  const copyUrl = async () => {
    await WMSDeepLink.copyCurrentUrl()
  }

  const generateShareLink = (additionalParams: Partial<DeepLinkParams> = {}) => {
    return WMSDeepLink.generateShareLink({ ...params, ...additionalParams })
  }

  return {
    params: memoizedParams,
    updateParams,
    clearParams,
    copyUrl,
    generateShareLink,
    hasDeepLink
  }
}
