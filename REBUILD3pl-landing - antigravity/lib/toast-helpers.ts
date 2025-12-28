/**
 * Toast notification helpers
 * Standardized toast messages for consistent UX
 */

import { toast } from "sonner"

/**
 * Show success toast
 */
export function showSuccess(message: string) {
    toast.success(message, {
        duration: 3000,
    })
}

/**
 * Show error toast
 */
export function showError(message: string) {
    toast.error(message, {
        duration: 5000,
    })
}

/**
 * Show info toast
 */
export function showInfo(message: string) {
    toast.info(message, {
        duration: 3000,
    })
}

/**
 * Show warning toast
 */
export function showWarning(message: string) {
    toast.warning(message, {
        duration: 4000,
    })
}

// Pre-defined success messages for common actions
export const SuccessMessages = {
    ORDER_CREATED: (orderId: string) => `Order #${orderId} created successfully!`,
    ORDER_UPDATED: (orderId: string) => `Order #${orderId} updated successfully!`,
    ORDER_DELETED: (orderId: string) => `Order #${orderId} deleted successfully!`,

    SHIPMENT_CREATED: (shipmentId: string) => `Shipment #${shipmentId} created successfully!`,
    SHIPMENT_UPDATED: (shipmentId: string) => `Shipment #${shipmentId} updated successfully!`,

    INVENTORY_ADDED: (quantity: number, item: string) => `Added ${quantity} units of ${item} to inventory`,
    INVENTORY_UPDATED: "Inventory updated successfully!",

    SETTINGS_SAVED: "Settings saved successfully!",
    PROFILE_UPDATED: "Profile updated successfully!",
    PASSWORD_CHANGED: "Password changed successfully!",

    DATA_EXPORTED: "Data exported successfully!",
    DATA_IMPORTED: "Data imported successfully!",

    GENERIC: "Action completed successfully!",
} as const

// Pre-defined error messages for common actions
export const ErrorMessages = {
    ORDER_CREATE_FAILED: "Failed to create order. Please try again.",
    ORDER_UPDATE_FAILED: "Failed to update order. Please try again.",
    ORDER_DELETE_FAILED: "Failed to delete order. Please try again.",

    SHIPMENT_CREATE_FAILED: "Failed to create shipment. Please try again.",
    SHIPMENT_UPDATE_FAILED: "Failed to update shipment. Please try again.",

    INVENTORY_UPDATE_FAILED: "Failed to update inventory. Please try again.",

    SETTINGS_SAVE_FAILED: "Failed to save settings. Please try again.",
    PROFILE_UPDATE_FAILED: "Failed to update profile. Please try again.",

    DATA_EXPORT_FAILED: "Failed to export data. Please try again.",
    DATA_IMPORT_FAILED: "Failed to import data. Please try again.",

    GENERIC: "An error occurred. Please try again.",
} as const
