import type { Metadata, Viewport } from 'next';
import { Inter, Literata, JetBrains_Mono } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';
import TopBar from '@/components/TopBar';
import Search from '@/components/Search';
import RevealObserver from '@/components/RevealObserver';
import MobileTabBar from '@/components/MobileTabBar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const literata = Literata({ subsets: ['latin'], variable: '--font-literata', display: 'swap', style: ['normal', 'italic'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Beyond Memorising · Electronic Science (UGC NET Code 88)', template: '%s · Beyond Memorising' },
  description: 'An interactive visual course for UGC NET Electronic Science (Code 88). Read it, drag it, solve it.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf6' },
    { media: '(prefers-color-scheme: dark)', color: '#141414' },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('esc-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;}catch(e){}document.documentElement.classList.add('js');})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-theme="light" className={`${inter.variable} ${literata.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">Skip to content</a>
        <TopBar />
        <div id="main">{children}</div>
        <MobileTabBar />
        <Search />
        <RevealObserver />
      </body>
    </html>
  );
}
