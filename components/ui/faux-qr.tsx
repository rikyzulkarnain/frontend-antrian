interface FauxQRProps {
  seed?: string;
}

function computeCells(seed: string, grid: number): Array<{ x: number; y: number }> {
  let s = seed.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if ((x < 7 && y < 7) || (x >= grid - 7 && y < 7) || (x < 7 && y >= grid - 7)) continue;
      s = (s * 1664525 + 1013904223) >>> 0;
      if (s / 0xffffffff > 0.55) cells.push({ x, y });
    }
  }
  return cells;
}

export function FauxQR({ seed = 'A018' }: FauxQRProps) {
  const grid = 21;
  const cells = computeCells(seed, grid);
  const Finder = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`}>
      <rect x={cx} y={cy} width="7" height="7" fill="#0b0b0c" />
      <rect x={cx + 1} y={cy + 1} width="5" height="5" fill="#fff" />
      <rect x={cx + 2} y={cy + 2} width="3" height="3" fill="#0b0b0c" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${grid} ${grid}`} shapeRendering="crispEdges">
      <rect x="0" y="0" width={grid} height={grid} fill="#fff" />
      {Finder(0, 0)}
      {Finder(grid - 7, 0)}
      {Finder(0, grid - 7)}
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill="#0b0b0c" />
      ))}
    </svg>
  );
}
