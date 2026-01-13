
import { create } from 'zustand';

export interface TabData {
    id: string;
    type: 'GANTT' | 'GRID' | 'LOAD_GRAPH' | 'ITEM_DETAIL' | 'MASTER_SCHEDULER' | 'SCENARIO_MANAGER';
    title: string;
    data?: any;
    closable?: boolean;
}

interface WorkspaceState {
    tabs: TabData[];
    activeTabId: string | null;

    openTab: (tab: TabData) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    tabs: [
        // Default Tab
        { id: 'master-scheduler', type: 'MASTER_SCHEDULER', title: 'Master Scheduler', closable: false }
    ],
    activeTabId: 'master-scheduler',

    openTab: (newTab) => set((state) => {
        const existing = state.tabs.find(t => t.id === newTab.id);
        if (existing) {
            return { activeTabId: existing.id };
        }
        return {
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id
        };
    }),

    closeTab: (id) => set((state) => {
        const newTabs = state.tabs.filter(t => t.id !== id);
        // If closing active tab, activate the last one
        let newActive = state.activeTabId;
        if (state.activeTabId === id) {
            newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }
        return {
            tabs: newTabs,
            activeTabId: newActive
        };
    }),

    setActiveTab: (id) => set({ activeTabId: id }),
}));
