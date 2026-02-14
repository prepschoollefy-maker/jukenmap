import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "JukenMap — 首都圏 中学受験 学校検索マップ",
  description:
    "首都圏の中学受験校をGoogle Maps上で検索・比較。偏差値・設置区分・エリアでフィルタし、自宅から通える学校を見つけよう。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
