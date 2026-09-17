export const metadata = {
  title: 'KYRO PROD',
  description: 'Minecraft Media Production Studio',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          body {
            background-color: #07060a !important;
            color: #ffffff !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .glow-purple {
            text-shadow: 0 0 20px rgba(168, 85, 247, 0.7);
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
