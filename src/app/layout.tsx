import type { Metadata } from "next";

import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "智能 BI 助手",
  description: "由 CopilotKit 驱动的智能 BI 助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={"antialiased"}>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="sample_agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
