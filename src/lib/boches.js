// Easter eggs for Airsoft Boches (Bocholtz). Since 2022.
export const BOCHES_BLUE = '#2f8cff';
export const isBoches = (s) => /boches|bocholtz/i.test(s || '');

const ribs = [[5.2, 9], [6.6, 6.2], [8.6, 4.4], [12, 3.6], [15.4, 4.4], [17.4, 6.2], [18.8, 9]]
  .map(([x, y]) => `<line x1="12" y1="19" x2="${x}" y2="${y}"/>`).join('');

/** Scallop shell (the Bocholtz shell), white with dark ribs. */
export function shellSvg(size = 14, fill = '#fff', stroke = '#0b1d3a') {
  return `<svg class="shell" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path d="M12 20.5 L3.6 10.4 Q3.2 3.2 12 2.6 Q20.8 3.2 20.4 10.4 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<g stroke="${stroke}" stroke-width="1" stroke-linecap="round">${ribs}</g>` +
    `<rect x="9.2" y="19" width="5.6" height="2.8" rx="0.8" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/></svg>`;
}
