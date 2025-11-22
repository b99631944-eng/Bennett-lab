import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Horror Finder Game',
  description: 'Find horror characters in a randomly generated house',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
