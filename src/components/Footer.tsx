"use client";

import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import {
    DEFAULT_SITE_CONTENT_SETTINGS,
    type PublicSiteSettings,
} from '@/features/settings/contracts';
import { fetchApi } from '@/lib/api-client';

export default function Footer() {
    const pathname = usePathname();
    const { data } = useSWR<PublicSiteSettings>(
        pathname.startsWith('/admin') ? null : '/api/settings',
        (url: string) => fetchApi<PublicSiteSettings>(url, { cache: 'no-store' }),
        { revalidateOnFocus: true, refreshInterval: 60_000 }
    );
    const site = data?.site || DEFAULT_SITE_CONTENT_SETTINGS;

    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="frontend-theme mt-auto w-full px-4 pb-5 text-center sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-[1380px] items-center justify-between border-t border-border/70 pt-5 text-xs text-muted-foreground">
                <p className="tracking-[0.08em]">
                    © {new Date().getFullYear()} {site.siteTitle}
                </p>
                <p className="hidden tracking-[0.16em] sm:block">{site.footerText}</p>
            </div>
            {site.disclaimerText && (
                <p className="mx-auto mt-3 max-w-3xl text-[10px] leading-5 text-muted-foreground/75">
                    {site.disclaimerText}
                </p>
            )}
        </footer>
    );
}
