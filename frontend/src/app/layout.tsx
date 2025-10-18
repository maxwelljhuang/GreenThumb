import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GreenThumb Discovery',
  description: 'Product discovery and search platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

