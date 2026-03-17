import { useState, useEffect } from 'react';

// 16x16 pixel art bag — matching BAG.png reference exactly
// 0=transparent, A=amber #ffb000, D=dark amber #cc8800, W=white #ffffff, X=black #000000
const A = 1, D = 2, W = 3, X = 4;

const BAG_PIXELS = [
//       0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
        [0, 0, 0, 0, 0, 0, 0, W, W, 0, 0, 0, 0, 0, 0, 0], // row 0  handle top
        [0, 0, 0, 0, 0, 0, W, 0, 0, W, 0, 0, 0, 0, 0, 0], // row 1  handle arch
        [0, 0, 0, 0, 0, W, 0, 0, 0, 0, W, 0, 0, 0, 0, 0], // row 2  handle sides
        [0, 0, 0, 0, 0, W, 0, 0, 0, 0, W, 0, 0, 0, 0, 0], // row 3  handle sides
        [0, 0, 0, 0, 0, W, 0, 0, 0, 0, W, 0, 0, 0, 0, 0], // row 4  handle sides
        [0, 0, A, A, A, W, A, A, A, A, W, A, A, D, 0, 0], // row 5  handle meets body
        [0, 0, A, A, A, A, A, A, A, A, A, A, A, D, 0, 0], // row 6  body top
        [0, A, A, A, X, A, X, A, A, A, A, A, A, A, D, 0], // row 7  left X top
        [0, A, A, A, A, X, A, A, A, A, A, A, A, A, D, 0], // row 8  left X center
        [A, A, A, A, X, A, X, A, A, A, X, A, X, A, A, D], // row 9  left X bot + right X top
        [A, A, A, A, A, A, A, A, A, A, A, X, A, A, A, D], // row 10 right X center
        [A, A, A, A, A, A, A, A, A, A, X, A, X, A, A, D], // row 11 right X bottom
        [A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, D], // row 12 body
        [D, D, D, A, A, A, A, A, A, A, A, A, A, D, D, D], // row 13 bottom base
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row 14
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row 15
];

const COLORS = {
  0: 'transparent',
  [A]: '#ffb000',
  [D]: '#cc8800',
  [W]: '#ffffff',
  [X]: '#000000',
};

const PIXEL_SIZE = 14;

export default function BagLogo({ flash }) {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlicker((f) => !f);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const [showFlash, setShowFlash] = useState(false);
  useEffect(() => {
    if (flash) {
      setShowFlash(true);
      const t = setTimeout(() => setShowFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [flash]);

  const size = 16 * PIXEL_SIZE;

  return (
    <div className="bag-logo-container">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="crispEdges"
        style={{
          imageRendering: 'pixelated',
          opacity: showFlash ? 0.3 : flicker ? 0.75 : 1,
        }}
      >
        {BAG_PIXELS.map((row, y) =>
          row.map((pixel, x) => {
            if (pixel === 0) return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x * PIXEL_SIZE}
                y={y * PIXEL_SIZE}
                width={PIXEL_SIZE}
                height={PIXEL_SIZE}
                fill={COLORS[pixel]}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

export { BAG_PIXELS, COLORS };
