import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

/**
 * TicketIllustration — Self-contained SVG boarding-pass art.
 * Thay thế icon `confirmation-number` đơn lẻ khi service chưa có hero image.
 *
 * Layered composition:
 *   1. Paper background (cream gradient)
 *   2. Header bar (sky gradient + "BOARDING PASS" eyebrow)
 *   3. Perforation dashed midline
 *   4. Notch circles (left + right)
 *   5. Dotted barcode lines
 *   6. Location pin glyph
 *   7. Number stamp (01)
 *   8. Subtle film grain via noise dots
 */
export function TicketIllustration({
  width = 320,
  height = 220,
  number = "01",
  eyebrow = "BOARDING PASS",
  variant = "hero", // "hero" | "mini" | "empty"
}) {
  const isMini = variant === "mini";
  const isEmpty = variant === "empty";
  const showDetails = !isMini;

  return (
    <Svg width={width} height={height} viewBox="0 0 320 220">
      <Defs>
        <LinearGradient id="tk-paper" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF8EC" />
          <Stop offset="1" stopColor="#F1E5CB" />
        </LinearGradient>
        <LinearGradient id="tk-sky" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7DD3FC" />
          <Stop offset="1" stopColor="#A5C9FF" />
        </LinearGradient>
        <LinearGradient id="tk-num" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7DD3FC" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#7DD3FC" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Paper card with double bezel */}
      <Rect
        x="6"
        y="6"
        width="308"
        height="208"
        rx="16"
        fill="rgba(0,0,0,0.06)"
      />
      <Rect
        x="4"
        y="4"
        width="312"
        height="212"
        rx="14"
        fill="url(#tk-paper)"
      />

      {/* Header bar — sky gradient */}
      <Path
        d="M4 18 Q4 4 18 4 H302 Q316 4 316 18 V58 H4 Z"
        fill="url(#tk-sky)"
      />
      <SvgText
        x="20"
        y="32"
        fontSize="9"
        fontWeight="800"
        letterSpacing="2"
        fill="rgba(11, 11, 15, 0.85)"
      >
        {eyebrow}
      </SvgText>

      {/* Number stamp (background watermark) */}
      <SvgText
        x="316"
        y="200"
        fontSize="92"
        fontWeight="900"
        letterSpacing="-4"
        textAnchor="end"
        fill="url(#tk-num)"
      >
        {number}
      </SvgText>

      {/* Dotted barcode lines — top right */}
      {Array.from({ length: 28 }).map((_, i) => (
        <Line
          key={`bc1-${i}`}
          x1={220 + i * 3}
          y1="22"
          x2={220 + i * 3}
          y2="48"
          strokeWidth={i % 4 === 0 ? 1.6 : 0.8}
          stroke="rgba(11, 11, 15, 0.55)"
        />
      ))}

      {/* Perforation dashed midline */}
      <Line
        x1="20"
        y1="130"
        x2="300"
        y2="130"
        stroke="rgba(11, 11, 15, 0.35)"
        strokeWidth="1.2"
        strokeDasharray="4 5"
      />

      {/* Notch circles on midline */}
      <Circle cx="4" cy="130" r="10" fill="rgba(0,0,0,0.06)" />
      <Circle cx="316" cy="130" r="10" fill="rgba(0,0,0,0.06)" />
      <Circle cx="4" cy="130" r="9" fill="#F5F5F7" />
      <Circle cx="316" cy="130" r="9" fill="#F5F5F7" />

      {/* Location pin glyph (left bottom) */}
      {showDetails ? (
        <G transform="translate(20 150)">
          <Path
            d="M10 0 C4.5 0 0 4.5 0 10 C0 17.5 10 26 10 26 C10 26 20 17.5 20 10 C20 4.5 15.5 0 10 0 Z"
            fill="rgba(11, 11, 15, 0.78)"
          />
          <Circle cx="10" cy="10" r="3.6" fill="#FFF8EC" />
        </G>
      ) : null}

      {/* Field label clusters (bottom half) */}
      {showDetails ? (
        <>
          <SvgText
            x="50"
            y="158"
            fontSize="7"
            fontWeight="700"
            letterSpacing="1.4"
            fill="rgba(11, 11, 15, 0.45)"
          >
            PLACE
          </SvgText>
          <SvgText
            x="50"
            y="170"
            fontSize="11"
            fontWeight="800"
            fill="rgba(11, 11, 15, 0.78)"
          >
            Can Tho
          </SvgText>

          <SvgText
            x="180"
            y="158"
            fontSize="7"
            fontWeight="700"
            letterSpacing="1.4"
            fill="rgba(11, 11, 15, 0.45)"
          >
            DATE
          </SvgText>
          <SvgText
            x="180"
            y="170"
            fontSize="11"
            fontWeight="800"
            fill="rgba(11, 11, 15, 0.78)"
          >
            --/--/--
          </SvgText>
        </>
      ) : null}

      {/* Wavy lines representing barcode / signature */}
      {Array.from({ length: 7 }).map((_, i) => (
        <Line
          key={`wv-${i}`}
          x1={24 + i * 8}
          y1={isMini ? 200 : 192}
          x2={28 + i * 8}
          y2={isMini ? 200 : 192}
          strokeWidth="6"
          stroke="rgba(11, 11, 15, 0.18)"
        />
      ))}

      {/* Subtle grain dots — film texture */}
      {!isMini
        ? Array.from({ length: 18 }).map((_, i) => {
            const x = ((i * 47) % 300) + 10;
            const y = ((i * 31) % 80) + 60;
            return (
              <Circle
                key={`g-${i}`}
                cx={x}
                cy={y}
                r={0.6}
                fill="rgba(11, 11, 15, 0.18)"
              />
            );
          })
        : null}
    </Svg>
  );
}