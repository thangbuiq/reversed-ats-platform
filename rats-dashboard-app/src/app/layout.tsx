import { Outfit } from 'next/font/google';
import './globals.css';
import 'flatpickr/dist/flatpickr.css';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';

const outfit = Outfit({
  subsets: ['latin'],
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
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
