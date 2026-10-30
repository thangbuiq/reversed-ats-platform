import { JetBrains_Mono } from 'next/font/google';
import './fonts.css';
import './globals.css';
import 'flatpickr/dist/flatpickr.css';
import { SidebarProvider } from '@/context/SidebarContext';
import { TooltipProvider } from '@/components/ui/tooltip';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata = {
  title: 'Reversed ATS Platform',
  description: 'Reversed ATS Platform - Find the best job match for your CV',
  openGraph: {
    title: 'Reversed ATS Platform',
    description: 'Reversed ATS Platform - Find the best job match for your CV',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={jetbrainsMono.variable} suppressHydrationWarning>
        <TooltipProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
