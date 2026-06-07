import "./globals.css";

export const metadata = {
  title: "Vanguard Sentinel — Cybersecurity Knowledge Graph OS",
  description:
    "Open-source, locally-hosted alternative to Palantir Foundry for cybersecurity log analysis and threat detection. Powered by Neo4j, LangChain, and local AI.",
  keywords: [
    "cybersecurity",
    "threat detection",
    "knowledge graph",
    "Neo4j",
    "GraphRAG",
    "SIEM",
    "threat intelligence",
    "network security",
    "incident response",
  ],
  authors: [{ name: "Dhy4n-117" }],
  creator: "Vanguard Sentinel Team",
  openGraph: {
    title: "Vanguard Sentinel — Cybersecurity Knowledge Graph OS",
    description:
      "Open-source threat detection platform powered by Neo4j knowledge graphs, LangChain GraphRAG, and real-time event simulation.",
    type: "website",
    locale: "en_US",
    siteName: "Vanguard Sentinel",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanguard Sentinel",
    description:
      "AI-powered cybersecurity knowledge graph for threat detection and incident response.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0f19",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
