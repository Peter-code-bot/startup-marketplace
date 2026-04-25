'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

const HIDE_FOOTER_PATTERN = /^\/chat(\/|$)/;

export function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_FOOTER_PATTERN.test(pathname)) return null;
  return <Footer />;
}
