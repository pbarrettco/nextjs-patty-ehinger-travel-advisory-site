"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Below this scroll depth the header stays transparent over the hero photo.
const TOP_ZONE = 80;
// Pointer this close to the top of the viewport pulls a hidden header back.
const HOVER_ZONE = 80;
// Trackpad jitter and iOS rubber-banding would otherwise flip the direction
// every frame; deltas below this accumulate instead of counting.
const SCROLL_THRESHOLD = 6;
// Grace period after the pointer leaves, so tracking along the boundary
// doesn't retrigger show/hide.
const HOVER_EXIT_DELAY = 250;

type HeaderState = "" | "active" | "hidden";

export default function Header() {
    // "" is the transparent-over-hero state, and what the server renders.
    const [state, setState] = useState<HeaderState>("");
    const [menuOpen, setMenuOpen] = useState(false);
    const lastY = useRef(0);
    const hovering = useRef(false);
    const frame = useRef<number | null>(null);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // The page can load already scrolled — a hash link, or a refresh
        // partway down — and the server always emits "". Staged in a frame
        // rather than set synchronously here, as in Panel.tsx; "" is already
        // correct at the top, so only the scrolled case needs a write.
        lastY.current = window.scrollY;
        frame.current = requestAnimationFrame(() => {
            frame.current = null;
            if (window.scrollY > TOP_ZONE) setState("active");
        });

        const resolve = () => {
            const y = window.scrollY;

            if (y <= TOP_ZONE) {
                lastY.current = y;
                setState("");
                return;
            }
            if (hovering.current) {
                lastY.current = y;
                setState("active");
                return;
            }

            const delta = y - lastY.current;
            // Leave lastY alone below the threshold, so small movements
            // accumulate rather than being swallowed one frame at a time.
            if (Math.abs(delta) < SCROLL_THRESHOLD) return;

            lastY.current = y;
            setState(delta > 0 ? "hidden" : "active");
        };

        // scroll fires far more often than the browser paints, so coalesce
        // to one evaluation per frame.
        const onScroll = () => {
            if (frame.current !== null) return;
            frame.current = requestAnimationFrame(() => {
                frame.current = null;
                resolve();
            });
        };

        const onMouseMove = (e: MouseEvent) => {
            if (e.clientY <= HOVER_ZONE) {
                if (hoverTimeout.current !== null) {
                    clearTimeout(hoverTimeout.current);
                    hoverTimeout.current = null;
                }
                if (hovering.current) return;
                hovering.current = true;
                // Only promote a hidden header. At the top of the page it
                // stays transparent rather than flashing a linen bar.
                if (window.scrollY > TOP_ZONE) setState("active");
                return;
            }

            if (!hovering.current || hoverTimeout.current !== null) return;
            hoverTimeout.current = setTimeout(() => {
                hoverTimeout.current = null;
                // Release the lock only. Re-hiding with no scroll input reads
                // as a twitch; the next downward scroll handles it.
                hovering.current = false;
            }, HOVER_EXIT_DELAY);
        };

        window.addEventListener("scroll", onScroll, { passive: true });

        // mousemove fires synthetically on touch taps, which would summon the
        // header every time the page is tapped.
        if (window.matchMedia("(hover: hover)").matches) {
            document.addEventListener("mousemove", onMouseMove);
        }

        return () => {
            window.removeEventListener("scroll", onScroll);
            document.removeEventListener("mousemove", onMouseMove);
            if (frame.current !== null) cancelAnimationFrame(frame.current);
            if (hoverTimeout.current !== null) clearTimeout(hoverTimeout.current);
        };
    }, []);

    useEffect(() => {
        if (!menuOpen) return;

        // Scrolling behind the open menu would still drive the header state,
        // and a downward scroll hides the header — taking the close button
        // off-screen with it.
        const root = document.documentElement;
        root.style.overflow = "hidden";

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        // Past the breakpoint the nav is inline again, but the scroll lock
        // would outlive it.
        const desktop = window.matchMedia("(min-width: 769px)");
        const onBreakpoint = (e: MediaQueryListEvent) => {
            if (e.matches) setMenuOpen(false);
        };

        document.addEventListener("keydown", onKeyDown);
        desktop.addEventListener("change", onBreakpoint);

        return () => {
            root.style.overflow = "";
            document.removeEventListener("keydown", onKeyDown);
            desktop.removeEventListener("change", onBreakpoint);
        };
    }, [menuOpen]);

    return (
        <header className={state}>
            <h1><Link href="/">Patty Ehinger Luxury Travel Advisory</Link></h1>
            <nav
                id="mainNav"
                className={menuOpen ? "active" : undefined}
                // Every item is an in-page anchor or a new tab, so any link
                // tap should dismiss the overlay.
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) setMenuOpen(false);
                }}
            >
                <Link href="#about">About</Link>
                <Link href="#our-team">Our Team</Link>
                <Link href="#careers">Careers</Link>
                <Link href="#contact">Contact</Link>
                <Link href="https://portal.pattyehingertravel.com" target="_blank" rel="noopener noreferrer">Client Portal</Link>
            </nav>
            <button
                id="mobileMenu"
                aria-controls="mainNav"
                aria-expanded={menuOpen}
                onClick={() => {
                    if (!menuOpen && window.location.hash) {
                        // Tapping a link whose hash is already in the URL is a
                        // no-op navigation; clearing it makes every menu link fire.
                        const { pathname, search } = window.location;
                        window.history.replaceState(null, "", pathname + search);
                    }
                    setMenuOpen((open) => !open);
                }}
            >
                {menuOpen ? "Close" : "Menu"}
            </button>
        </header>
    );
}