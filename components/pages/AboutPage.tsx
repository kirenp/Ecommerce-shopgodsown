"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ourstoryPicHero3 from "@/public/images/ourstorypic-hero3.png";
import ourstoryPic8 from "@/public/images/ourstorypic-8.png";
import ourstoryPic9 from "@/public/images/ourstorypic-9.png";
import ourstoryPic10 from "@/public/images/ourstorypic-10.png";
import ourstoryPic1 from "@/public/images/ourstory-pic1.png";

export default function AboutPageContent() {
  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 01 — HERO: "FOR THOSE WHO DON'T PLAY TO LOSE."
          Editorial hero with bold headline + image grid right side
      ═══════════════════════════════════════════════════════════════ */}
      <section className="pt-32 sm:pt-36 md:pt-40 pb-0 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          {/* Label */}
          <p className="text-[10px] text-black/50 tracking-[0.4em] uppercase mb-6 font-semibold">
            OUR STORY
          </p>

          {/* Main grid: headline left, images right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
            {/* Left — Headline + intro copy */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <h1 className="font-sans font-black text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.95] tracking-tight uppercase text-black">
                  FOR THOSE<br />
                  WHO DON&apos;T<br />
                  <span className="text-[#C81E1E]">PLAY TO LOSE.</span>
                </h1>

                <div className="mt-8 md:mt-10 max-w-md space-y-4">
                  <p className="text-black/70 text-[13px] md:text-sm leading-relaxed">
                    Some days are about the next move. Some are about losing track of time.
                  </p>
                  <p className="text-black/70 text-[13px] md:text-sm leading-relaxed">
                    Early mornings, late nights, work, weekends, unfamiliar places, familiar ones. Life keeps changing, and what you wear moves with it.
                  </p>
                  <p className="text-black/70 text-[13px] md:text-sm leading-relaxed">
                    GOD&apos;S OWN was built around that idea — clothing that fits into the different sides of life without being defined by just one of them.
                  </p>
                  <p className="text-black/70 text-[13px] md:text-sm leading-relaxed">
                    We make pieces with enough character to stand on their own, and enough versatility to become part of yours.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — Editorial image grid */}
            <div className="lg:col-span-6 grid grid-cols-12 grid-rows-6 gap-2 min-h-[420px] md:min-h-[520px]">
              {/* Large hero image — top left area */}
              <div className="col-span-8 row-span-4 bg-black/10 rounded-sm overflow-hidden relative group cursor-pointer">
                <Image
                  src={ourstoryPic1}
                  alt="God's Own Story - For those who don't play to lose"
                  fill
                  priority
                  className="object-cover object-center animate-color-blink group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                />
              </div>

              {/* Section index badge — top right */}
              <div className="col-span-4 row-span-2 flex flex-col items-end justify-start pt-2 pr-2">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[#C81E1E] text-[11px] font-bold tracking-wider">01</span>
                  <div className="w-px h-10 bg-black/15"></div>
                </div>
              </div>

              {/* Smaller image + text cards */}
              <div className="col-span-4 row-span-2 flex items-end">
                {/* "More Than Clothing" italic text */}
                <p className="text-black/40 text-[11px] italic leading-tight text-right w-full pr-1">
                  More<br />Than<br />Clothing
                </p>
              </div>

              {/* Bottom image strip */}
              <div className="col-span-6 row-span-2 bg-black/10 rounded-sm overflow-hidden relative group cursor-pointer">
                <Image
                  src="/images/ourstorypic-2.png"
                  alt="God's Own - More Than A Label"
                  fill
                  className="object-cover object-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 30vw, 20vw"
                />
              </div>
              <div className="col-span-6 row-span-2 bg-black/10 rounded-sm overflow-hidden relative group cursor-pointer">
                <Image
                  src="/images/ourstory-pic3.png"
                  alt="God's Own - Culture & Lifestyle"
                  fill
                  className="object-cover object-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 30vw, 20vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 02 — MADE WITH INTENTION
          Dark banner with vertical text sidebar, content center, image grid right
      ═══════════════════════════════════════════════════════════════ */}
      <section className="mt-12 md:mt-16 bg-black text-white relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[600px] md:min-h-[680px]">

          {/* Left sidebar — vertical text & vertical image strip */}
          <div className="lg:col-span-2 relative hidden lg:flex flex-col">
            {/* Top label */}
            <div className="px-5 pt-10">
              <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase font-bold leading-relaxed">
                DETAILS<br />MAKE<br />DIFFERENCE
              </p>
            </div>

            {/* Vertical dark image strip with GOD'S OWN text */}
            <div className="flex-1 mx-5 my-6 bg-white/5 rounded-sm relative overflow-hidden flex items-center justify-center group cursor-pointer">
              <Image
                src="/images/ourstorypic-4.png"
                alt="God's Own - Details Make Difference"
                fill
                className="object-cover object-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                sizes="(max-width: 1024px) 100vw, 20vw"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
              {/* vertical text over image */}
              <p
                className="relative z-10 text-white/70 group-hover:text-white text-sm tracking-[0.5em] uppercase font-bold transition-colors duration-500 select-none drop-shadow-md"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                GOD&apos;S OWN
              </p>
            </div>

            {/* Bottom label */}
            <div className="px-5 pb-10">
              <p className="text-[9px] text-white/30 tracking-[0.3em] uppercase font-semibold leading-relaxed">
                FIT<br />FABRIC<br />FINISH<br />ALWAYS
              </p>
            </div>
          </div>

          {/* Center — Content */}
          <div className="lg:col-span-5 px-6 md:px-8 py-12 md:py-16 flex flex-col justify-center">
            <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase mb-5 font-semibold">02.</p>
            <h2 className="font-sans font-black text-4xl md:text-[3.2rem] leading-[1.05] tracking-tight uppercase mb-8">
              MADE WITH<br />INTENTION.
            </h2>

            <div className="space-y-5 max-w-md">
              <p className="text-white/70 text-[13px] leading-relaxed">
                We believe the difference is in the details.
              </p>
              <p className="text-white/60 text-[13px] leading-relaxed">
                A silhouette that sits the right way. A sleeve that falls properly. A size that actually feels like the size it should be. The weight and feel of the fabric. The placement of a graphic. The way a print holds up. The finishing touches that might seem small but change the whole piece.
              </p>
              <p className="text-white/70 text-[13px] leading-relaxed">
                Every GOD&apos;S OWN garment goes through that process.
              </p>
              <p className="text-white/60 text-[13px] leading-relaxed">
                We look at the fit. We look at the proportions.<br />
                We test the sizing. We refine the artwork.<br />
                We question the details.
              </p>
              <p className="text-white/60 text-[13px] leading-relaxed">
                Then we do it again until it feels right.
              </p>
              <p className="text-white/70 text-[13px] leading-relaxed">
                Because putting our name on something means we should be happy to wear it ourselves.
              </p>
            </div>
          </div>

          {/* Right — Image stack with text badges outside */}
          <div className="lg:col-span-5 flex flex-col gap-4 p-3 md:p-4">
            {/* Row 1 — Image + "BUILT DIFFERENT FOR REAL LIFE" */}
            <div className="flex gap-4 items-center">
              <div className="w-[55%] aspect-[4/3] bg-white/5 rounded-sm overflow-hidden relative group cursor-pointer shrink-0">
                <Image
                  src="/images/ourstorypic-5.png"
                  alt="God's Own - Built Different for Real Life"
                  fill
                  className="object-cover object-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 1024px) 60vw, 25vw"
                />
              </div>
              <p className="text-[9px] md:text-[10px] text-white/40 tracking-[0.3em] uppercase font-bold leading-relaxed text-right flex-1">
                BUILT<br />DIFFERENT<br />FOR<br />REAL LIFE
              </p>
            </div>

            {/* Row 2 — Image + "SAME WARDROBE DIFFERENT STORIES" (red-themed, no grayscale) */}
            <div className="flex gap-4 items-center">
              <div className="w-[55%] aspect-[4/3] bg-white/5 rounded-sm overflow-hidden relative group cursor-pointer shrink-0">
                <Image
                  src="/images/ourstorypic-6.png"
                  alt="God's Own - Same Wardrobe Different Stories"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 1024px) 60vw, 25vw"
                />
                {/* Red shade overlay */}
                <div className="absolute inset-0 bg-[#8B0000]/60 mix-blend-multiply pointer-events-none" />
              </div>
              <p className="text-[9px] md:text-[10px] text-white/40 tracking-[0.3em] uppercase font-bold leading-relaxed text-right flex-1">
                SAME<br />WARDROBE<br />DIFFERENT<br />STORIES
              </p>
            </div>

            {/* Row 3 — Image + "LIFE MOVES SO DO WE" */}
            <div className="flex gap-4 items-center">
              <div className="w-[55%] aspect-[4/3] bg-white/5 rounded-sm overflow-hidden relative group cursor-pointer shrink-0">
                <Image
                  src="/images/ourstorypic-7.png"
                  alt="God's Own - Life Moves So Do We"
                  fill
                  className="object-cover object-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 1024px) 60vw, 25vw"
                />
              </div>
              <p className="text-[9px] md:text-[10px] text-white/40 tracking-[0.3em] uppercase font-bold leading-relaxed text-right flex-1">
                LIFE<br />MOVES<br />SO DO<br />WE
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 03 — MADE FOR REAL LIFE
          Split: text left, cinematic landscape image right, small image strip below
      ═══════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 03 — MADE FOR REAL LIFE
          Split: text left, cinematic landscape image + crimson red strip right (same height, same level)
          Clean, moderate white space above and below (py-8 sm:py-10 lg:py-12)
          Snug gap between content and big image container
          Continuous thumbnail strip aligned with text and overlapping big image
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F7F4EF] py-8 sm:py-10 lg:py-12 relative overflow-hidden">
        <div className="w-full pl-6 md:pl-10 lg:pl-14 xl:pl-16 pr-0">
          <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8 xl:gap-10 relative">

            {/* Left column — Text content */}
            <div className="w-full lg:w-[290px] xl:w-[320px] shrink-0 flex flex-col justify-between pt-1 pb-2 relative z-20">
              <div>
                <p className="text-[10px] md:text-[11px] text-black/40 tracking-[0.3em] uppercase mb-3 sm:mb-4 font-semibold">03.</p>
                <h2 className="font-sans font-black text-3xl md:text-4xl lg:text-[2.4rem] xl:text-[2.7rem] leading-[1.05] tracking-tight uppercase text-black mb-5 sm:mb-6">
                  MADE FOR<br />REAL LIFE.
                </h2>

                <div className="space-y-3.5 sm:space-y-4 text-black/70 text-[12.5px] leading-relaxed">
                  <p>
                    We don&apos;t believe clothing needs to belong to one particular setting.
                  </p>
                  <p className="text-black/60">
                    The same wardrobe can take you through a morning that turns into a long day, a last-minute plan, a night out, a trip somewhere new, or a day with absolutely nothing on the schedule.
                  </p>
                  <p>
                    That&apos;s the kind of versatility we look for.
                  </p>
                  <p className="text-black/60">
                    Not clothing made for a particular moment, but clothing that becomes part of yours.
                  </p>
                </div>
              </div>

              {/* Mobile / Tablet only: continuous strip under text */}
              <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 mt-6">
                <div className="w-4 h-[1.5px] bg-black/40 shrink-0" />
                <div className="relative w-[96px] h-[68px] overflow-hidden shrink-0 group cursor-pointer">
                  <Image
                    src={ourstoryPic8}
                    alt="Urban"
                    fill
                    className="object-cover thumb-color-reveal grayscale group-hover:grayscale-0 hover:grayscale-0 transition-all duration-500"
                    sizes="96px"
                  />
                </div>
                <div className="relative w-[96px] h-[68px] overflow-hidden shrink-0">
                  <Image src={ourstoryPic9} alt="Nature" fill className="object-cover grayscale" sizes="96px" />
                </div>
                <div className="relative w-[96px] h-[68px] overflow-hidden shrink-0 group cursor-pointer">
                  <Image
                    src={ourstoryPic10}
                    alt="Indoors"
                    fill
                    className="object-cover animate-color-blink transition-all duration-500"
                    sizes="96px"
                  />
                </div>
                <div className="bg-white px-3 py-1.5 shrink-0 shadow-sm border border-black/5 h-[68px] flex flex-col justify-center">
                  <p className="text-[8px] text-black/70 tracking-[0.2em] uppercase font-bold leading-[1.4]">
                    DIFFERENT<br />DAYS<br />SAME<br />YOU
                  </p>
                </div>
              </div>
            </div>

            {/* Right column — Big Image + Red Stripe container */}
            <div className="flex-1 flex flex-row items-stretch min-h-[360px] sm:min-h-[400px] md:min-h-[430px] lg:min-h-[450px] xl:min-h-[470px] relative">
              {/* Cinematic hero image — NO ZOOM EFFECT, same level as red strip */}
              <div className="relative flex-1 overflow-hidden h-full">
                <Image
                  src={ourstoryPicHero3}
                  alt="God's Own - Made For Real Life"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              </div>

              {/* Overlapping thumbnail strip anchored directly to big image's bottom-left corner */}
              <div className="absolute left-0 bottom-0 z-30 hidden lg:flex items-stretch">
                {/* Small images moved to the right, adjacent to big image */}
                <div className="absolute right-full bottom-0 flex items-stretch gap-1 mr-1">
                  {/* Left margin dash */}
                  <div className="w-4 h-[1.5px] bg-black/40 self-center shrink-0 mr-1.5 hidden xl:block" />

                  {/* Thumb 1: Man in cap — reveals original color on hover */}
                  <div className="relative w-[108px] xl:w-[120px] h-[80px] xl:h-[88px] overflow-hidden shrink-0 group cursor-pointer">
                    <Image
                      src={ourstoryPic8}
                      alt="Made for real life - Urban"
                      fill
                      className="object-cover thumb-color-reveal grayscale group-hover:grayscale-0 hover:grayscale-0 transition-all duration-500"
                      sizes="120px"
                    />
                  </div>

                  {/* Thumb 2: Palm trees */}
                  <div className="relative w-[108px] xl:w-[120px] h-[80px] xl:h-[88px] overflow-hidden shrink-0">
                    <Image
                      src={ourstoryPic9}
                      alt="Made for real life - Nature"
                      fill
                      className="object-cover grayscale"
                      sizes="120px"
                    />
                  </div>

                  {/* Thumb 3: Silhouette by window / embroidery — automatically blinks between color and black & white */}
                  <div className="relative w-[108px] xl:w-[120px] h-[80px] xl:h-[88px] overflow-hidden shrink-0 group cursor-pointer">
                    <Image
                      src={ourstoryPic10}
                      alt="Made for real life - Indoors"
                      fill
                      className="object-cover animate-color-blink transition-all duration-500"
                      sizes="120px"
                    />
                  </div>
                </div>

                {/* Last container: DIFFERENT DAYS SAME YOU — bottom-left corner is at big image's bottom-left corner */}
                <div className="flex flex-col justify-center px-4 xl:px-5 py-2 shrink-0 bg-white shadow-md border border-black/5 h-[80px] xl:h-[88px]">
                  <p className="text-[9px] xl:text-[10px] text-black/70 tracking-[0.22em] uppercase font-bold leading-[1.55] text-left">
                    DIFFERENT<br />DAYS<br />SAME<br />YOU
                  </p>
                </div>
              </div>

              {/* Solid crimson red strip — locked to exact same level and height as hero image */}
              <div className="bg-[#8B1A1A] w-[110px] sm:w-[130px] md:w-[150px] lg:w-[160px] xl:w-[175px] shrink-0 flex flex-col justify-center px-4 sm:px-6 lg:px-7 xl:px-8 h-full">
                {/* Top dash */}
                <div className="w-5 h-[1.5px] bg-white/40 mb-5 sm:mb-6" />
                <p className="text-[9.5px] sm:text-[10px] md:text-[11px] text-white/80 tracking-[0.25em] uppercase font-bold leading-[1.7] text-left">
                  PLACES<br />PEOPLE<br />PLANS<br />POSSIBILITIES
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 04 — ALWAYS SOMETHING MORE + CLOSING
          Dark section with final brand statement
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-end">
            {/* Left — Content */}
            <div>
              <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase mb-5 font-semibold">04.</p>
              <h2 className="font-sans font-black text-4xl md:text-[3.5rem] leading-[1.05] tracking-tight uppercase mb-8">
                ALWAYS<br />SOMETHING MORE.
              </h2>

              <div className="space-y-5 max-w-lg">
                <p className="text-white/70 text-[13px] leading-relaxed">
                  GOD&apos;S OWN is only getting started.
                </p>
                <p className="text-white/60 text-[13px] leading-relaxed">
                  There are more ideas to turn into clothing, more materials to explore, more fits to develop, more stories to tell, and more places we want to take the brand.
                </p>
                <p className="text-white/60 text-[13px] leading-relaxed">
                  We don&apos;t know exactly where it will lead.
                </p>
                <p className="text-white/70 text-[13px] leading-relaxed">
                  We know we want to keep making it better.
                </p>
              </div>
            </div>

            {/* Right — Brand sign-off */}
            <div className="flex flex-col items-end justify-end text-right">
              <h3 className="font-sans font-black text-4xl md:text-5xl tracking-[0.15em] uppercase leading-tight">
                <span className="text-[#C81E1E]">GOD&apos;S</span> OWN
              </h3>
              <p className="mt-4 text-white/50 text-[11px] tracking-[0.2em] uppercase font-medium">
                For those who don&apos;t play to lose.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
