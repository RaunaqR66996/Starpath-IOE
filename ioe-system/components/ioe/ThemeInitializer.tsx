"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme-store";

export function ThemeInitializer() {
    const { theme } = useThemeStore();

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    return null;
}
