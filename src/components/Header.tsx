import Link from "next/link";

export default function Header() {
    return (
        <header>
            <h1><Link href="/">Patty Ehinger Luxury Travel Advisory</Link></h1>
            <nav>
                <Link href="#about">About</Link>
                <Link href="#our-team">Our Team</Link>
                <Link href="#contact">Contact</Link>
            </nav>
        </header>
    );
}