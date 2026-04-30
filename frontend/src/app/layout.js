import "./globals.css";

export const metadata = {
  title: "Vanguard Sentinel — Cybersecurity Knowledge Graph OS",
  description: "Open-source, locally-hosted alternative to Palantir Foundry for cybersecurity log analysis and threat detection. Powered by Neo4j, LangChain, and Gemini AI.",
  keywords: ["cybersecurity", "threat detection", "knowledge graph", "Neo4j", "GraphRAG"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
