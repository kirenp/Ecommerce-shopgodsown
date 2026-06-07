/**
 * CoconutPalmSVG — inline SVG illustration
 * Native transparency: zero background box, no PNG artifacts.
 * Use `flip` to mirror for the right-side tree.
 */
export default function CoconutPalmSVG({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  const trunk = "#b5b5b5";
  const frond = "#c2c2c2";
  const leaf = "#cccccc";
  const coconut1 = "#c8a227";
  const coconut2 = "#d4af37";
  const coconut3 = "#b08820";

  return (
    <svg
      viewBox="0 0 360 560"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      {/* ── TRUNK ── */}
      <path
        d="M 94,552 C 99,495 118,432 142,368 C 165,306 188,248 198,190 C 208,136 206,105 194,78"
        stroke={trunk}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* Trunk segment marks */}
      {([ [100,522,114,518],[110,487,123,483],[120,451,133,448],[131,415,143,412],[142,379,154,377],[153,345,164,343],[164,312,174,311],[174,279,184,279],[184,249,193,249],[192,220,200,221],[197,194,205,196],[199,170,207,172] ] as [number,number,number,number][]).map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.65" opacity="0.75" />
      ))}

      {/* ── FRONDS from crown (194, 78) ── */}

      {/* Frond A — upper right sweep */}
      <path d="M 194,78 C 222,54 268,32 328,12" stroke={frond} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {([[208,70,213,56],[208,70,203,82],[226,62,232,49],[226,62,221,74],[246,53,253,40],[246,53,240,66],[268,44,275,32],[268,44,262,57],[292,33,298,22],[292,33,286,45],[315,22,320,12]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.75"/>
      ))}

      {/* Frond B — horizontal right */}
      <path d="M 194,78 C 232,68 275,73 324,90" stroke={frond} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {([[210,76,215,63],[210,76,206,89],[232,74,237,62],[232,74,228,87],[256,76,261,63],[256,76,251,89],[280,80,285,67],[280,80,275,93],[305,86,310,74],[305,86,300,99]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.75"/>
      ))}

      {/* Frond C — right droop */}
      <path d="M 194,78 C 225,94 260,122 286,162" stroke={frond} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {([[206,86,213,74],[206,86,199,97],[222,96,229,85],[222,96,215,107],[240,110,248,100],[240,110,233,121],[258,128,266,118],[258,128,251,138],[275,148,282,139],[275,148,268,158]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.75"/>
      ))}

      {/* Frond D — far right heavy droop */}
      <path d="M 194,78 C 213,96 228,140 226,192" stroke={frond} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {([[200,90,208,83],[200,90,192,98],[210,113,218,107],[210,113,203,121],[218,140,226,134],[218,140,211,147],[223,166,230,160]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.65"/>
      ))}

      {/* Frond E — upper left sweep */}
      <path d="M 194,78 C 168,54 124,34 64,16" stroke={frond} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {([[180,70,175,56],[180,70,184,82],[162,61,157,47],[162,61,166,74],[142,51,137,37],[142,51,146,64],[120,41,115,28],[120,41,124,54],[98,31,93,19],[98,31,102,43],[78,23,73,12]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.75"/>
      ))}

      {/* Frond F — horizontal left */}
      <path d="M 194,78 C 158,68 114,74 66,93" stroke={frond} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {([[176,75,171,62],[176,75,180,88],[156,74,151,61],[156,74,160,87],[135,76,130,63],[135,76,139,89],[113,80,108,67],[113,80,117,93],[90,87,85,75],[90,87,94,100]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.75"/>
      ))}

      {/* Frond G — left droop */}
      <path d="M 194,78 C 164,96 130,126 100,166" stroke={frond} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {([[182,87,177,75],[182,87,188,99],[168,99,163,87],[168,99,174,110],[152,114,147,103],[152,114,158,125],[136,132,131,121],[136,132,142,143],[120,150,114,140],[120,150,126,161],[108,163,103,153]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.75"/>
      ))}

      {/* Frond H — straight up */}
      <path d="M 194,78 C 192,50 194,25 198,-4" stroke={frond} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {([[191,62,183,55],[191,62,199,55],[192,44,184,37],[192,44,200,37],[194,28,186,22],[194,28,202,22]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.65"/>
      ))}

      {/* Frond I — upper-left upswept */}
      <path d="M 194,78 C 172,48 146,26 116,7" stroke={frond} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {([[183,64,178,51],[183,64,188,76],[170,51,164,38],[170,51,176,62],[155,37,149,25],[155,37,161,48],[139,23,133,12],[139,23,145,33]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={leaf} strokeWidth="0.65"/>
      ))}

      {/* ── COCONUTS at crown base ── */}
      <ellipse cx="176" cy="91" rx="11" ry="10" fill={coconut1} opacity="0.92"/>
      <ellipse cx="190" cy="95" rx="10" ry="9"  fill={coconut2} opacity="0.88"/>
      <ellipse cx="182" cy="101" rx="10" ry="9" fill={coconut3} opacity="0.82"/>
      <ellipse cx="170" cy="99" rx="9"  ry="8"  fill={coconut1} opacity="0.78"/>
      <ellipse cx="197" cy="101" rx="9" ry="8"  fill={coconut2} opacity="0.72"/>
    </svg>
  );
}
