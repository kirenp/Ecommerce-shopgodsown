import { Zap, Star, Flame, Crown } from "lucide-react";

const STRIP_ITEMS = [
  { icon: <Zap size={14} />, text: "KERALA ORIGINALS" },
  { icon: <Flame size={14} />, text: "BACKWATER DROPS" },
  { icon: <Crown size={14} />, text: "HERITAGE PRIDE" },
  { icon: <Zap size={14} />, text: "GODS OWN" },
  { icon: <Star size={14} />, text: "TRADITION REBORN" },
  { icon: <Flame size={14} />, text: "CULTURAL LUXE" },
  { icon: <Crown size={14} />, text: "VESSEL OF STYLE" },
];

export default function CategoryStrip() {
  return (
    <div className="w-full bg-black border-y border-white/10 overflow-hidden py-9">
      <div className="flex w-fit animate-marquee whitespace-nowrap">
        <div className="flex items-center space-x-12 px-6">
          {STRIP_ITEMS.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-4 shrink-0 px-4">
              <div className="w-10 h-10 rounded-full border border-luxury-gold/30 flex items-center justify-center text-luxury-gold bg-luxury-gold/5">
                {item.icon}
              </div>
              <span className={`text-luxury-gold text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase ${item.text === "GODS OWN" ? "font-geishta" : ""}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
        {/* Duplicate for seamless loop */}
        <div className="flex items-center space-x-12 px-6">
          {STRIP_ITEMS.map((item, idx) => (
            <div key={`dup-${idx}`} className="flex items-center space-x-4 shrink-0 px-4">
              <div className="w-10 h-10 rounded-full border border-luxury-gold/30 flex items-center justify-center text-luxury-gold bg-luxury-gold/5">
                {item.icon}
              </div>
              <span className={`text-luxury-gold text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase ${item.text === "GODS OWN" ? "font-geishta" : ""}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
