const paths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z', tasks: 'M5 4h14v17H5z M8 9l2 2 4-4 M8 16h8',
  calendar: 'M4 6h16v15H4z M8 3v6 M16 3v6 M4 11h16', chat: 'M4 4h16v13H8l-4 4z M8 9h8 M8 13h5',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  stats: 'M4 20v-6h4v6 M10 20V8h4v12 M16 20V4h4v16', bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 20h4',
  plus: 'M12 4v16 M4 12h16', arrow: 'M5 12h14 M13 6l6 6-6 6', back: 'M19 12H5 M11 6l-6 6 6 6',
  sun: 'M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6 7 7 M17 17l1.4 1.4 M18.4 5.6 17 7 M7 17l-1.4 1.4 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'
};
export function Ikonka({ name, size = 22 }: { name: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.home} /></svg>; }
