import './globals.css';
import React from 'react';

export const metadata = {
  title: '33° Time Tracker',
  description: 'Clock in/out with customer & function',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
