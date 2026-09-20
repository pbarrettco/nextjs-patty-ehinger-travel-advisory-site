"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PortableText } from "next-sanity";

import { type TeamMember } from "./TeamGrid";

// Must stay comfortably above the opacity transition in panel.scss.
const FADE_OUT_FALLBACK_MS = 400;

export default function Panel({
    member,
    onClose,
}: {
    member: TeamMember;
    onClose: () => void;
}) {
    const panelRef = useRef<HTMLElement>(null);
    // entering → open → closing. Starting at "entering" rather than a plain
    // boolean keeps the unmount effect below from firing on mount.
    const [phase, setPhase] = useState<"entering" | "open" | "closing">("entering");

    // Fade out first; onClose() unmounts us once the transition lands.
    const close = useCallback(() => setPhase("closing"), []);

    // Apply .active after first paint so the browser sees a transition
    // rather than an initial value.
    useEffect(() => {
        const frame = requestAnimationFrame(() => setPhase("open"));
        panelRef.current?.focus();
        return () => cancelAnimationFrame(frame);
    }, []);

    // pointerdown, not click: the <li> opens the panel on click, and a
    // document-level click listener registered during that same event would
    // fire for it and close the panel instantly.
    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            const el = panelRef.current;
            if (!el) return;
            // Hit-test by coordinates rather than el.contains(e.target): the
            // scrim is the panel's own ::before, so a press on it reports the
            // panel as the target and contains() would never let us close.
            const { top, right, bottom, left } = el.getBoundingClientRect();
            const inside =
                e.clientX >= left && e.clientX <= right &&
                e.clientY >= top && e.clientY <= bottom;
            if (!inside) close();
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [close]);

    // Unmount once the fade out finishes. The timeout covers reduced-motion
    // and any case where transitionend doesn't fire.
    useEffect(() => {
        if (phase !== "closing") return;
        const el = panelRef.current;
        if (!el) return;

        const onTransitionEnd = (e: TransitionEvent) => {
            if (e.target === el && e.propertyName === "opacity") onClose();
        };
        el.addEventListener("transitionend", onTransitionEnd);
        const timeout = setTimeout(onClose, FADE_OUT_FALLBACK_MS);
        return () => {
            el.removeEventListener("transitionend", onTransitionEnd);
            clearTimeout(timeout);
        };
    }, [phase, onClose]);

    return (
        <section
            id="panel"
            ref={panelRef}
            className={phase === "open" ? "active" : ""}
            role="dialog"
            aria-modal="true"
            aria-label={member.name}
            tabIndex={-1}
        >
            <button type="button" aria-label="Close" onClick={close}>Close</button>
            <h3>{member.name}<br /><i>{member.jobTitle}</i></h3>
            {member.bio && <PortableText value={member.bio} />}
        </section>
    )
}
