import Image from "next/image"

export interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/blueship-sync-logo.png"
        alt="Blueship Sync"
        width={size === "sm" ? 24 : size === "md" ? 32 : 40}
        height={size === "sm" ? 24 : size === "md" ? 32 : 40}
        className={`${sizeClasses[size]}`}
      />
    </div>
  )
}
