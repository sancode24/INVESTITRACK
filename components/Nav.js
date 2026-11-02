import Link from 'next/link';

const links = [
  ['/', 'Dashboard'], ['/holdings', 'Holdings'], ['/trades', 'Trades'],
  ['/analytics', 'Analytics'], ['/notes', 'Notes'],
];

export default function Nav() {
  return (
    <nav className="nav">
      <strong>InvestiTrack</strong>
      {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
  );
}
