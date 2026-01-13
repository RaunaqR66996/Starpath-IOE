import { create } from 'zustand';

interface UIStore {
    activeModule: string;
    setActiveModule: (module: string) => void;
    // Layout
    rightPanelOpen: boolean;
    sidebarOpen: boolean;
    toggleRightPanel: () => void;
    toggleSidebar: () => void;
    setRightPanelOpen: (open: boolean) => void;
    setSidebarOpen: (open: boolean) => void;

    // Overseer Mode
    isOverseerMode: boolean;
    toggleOverseerMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    activeModule: 'control-tower',
    setActiveModule: (module) => set({ activeModule: module }),

    rightPanelOpen: true,
    sidebarOpen: true,
    toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    // Overseer Mode (Admin Override)
    isOverseerMode: false,
    toggleOverseerMode: () => set((state) => ({ isOverseerMode: !state.isOverseerMode })),
}));
