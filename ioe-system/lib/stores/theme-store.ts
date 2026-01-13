import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'cosmic' | 'light' | 'dracula' | 'monokai';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'cosmic',
            setTheme: (theme) => {
                // Update state
                set({ theme });

                // Update DOM immediately (fail-safe)
                if (typeof document !== 'undefined') {
                    const body = document.querySelector('body');
                    if (body) {
                        body.setAttribute('data-theme', theme);
                    }
                }
            },
        }),
        {
            name: 'ioe-theme-storage',
        }
    )
);
