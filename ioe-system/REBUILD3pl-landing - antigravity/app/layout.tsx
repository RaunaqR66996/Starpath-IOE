import type React from "react"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { Toaster } from "react-hot-toast"
import { AgentChat } from "@/components/ai/AgentChat"

const inter = Inter({
  subsets: ["latin"],
  // Include a range of weights for different text styles
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap", // Ensure text is visible while font loads
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
})

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
})

const jetmono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetmono",
  display: "swap",
})

export const metadata = {
  title: "StarPath",
  description: "3PL Shipping and Logistics Management Platform",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${grotesk.variable} ${jetmono.variable} light`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force light theme immediately
              document.documentElement.classList.add('light');
              document.documentElement.classList.remove('dark');
              document.documentElement.style.setProperty('--background', '0 0% 100%');
              document.documentElement.style.setProperty('--foreground', '0 0% 3.9%');
              document.documentElement.style.backgroundColor = '#ffffff';
              document.documentElement.style.color = '#000000';
            `,
          }}
        />
      </head>
      <body className={`${inter.className} light`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="blueship-theme"
          forcedTheme="light"
        >
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
            <AgentChat />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
