import './globals.css';

export const metadata = {
  title: 'Amethyst Store',
  description: 'Minecraft Services & Consultation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

