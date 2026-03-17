export default function TaglineMarquee() {
  const tagline =
    'CAPTURE THE FLAG ENDED AT RECESS. CAPTURE THE BAG PAYS RENT.';
  const network = 'BASE SEPOLIA';
  const sep = '\u00A0\u00A0\u00A0\u2022\u00A0\u00A0\u00A0';
  const networkEl = <span className="marquee-network">{network}</span>;
  const unit = <>{tagline}{sep}{networkEl}{sep}</>;
  const repeated = <>{unit}{unit}{unit}{unit}</>;

  return (
    <div className="marquee-bar">
      <div className="marquee-track">
        <span className="marquee-text">{repeated}</span>
        <span className="marquee-text">{repeated}</span>
      </div>
    </div>
  );
}
