import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Users, Activity } from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { RevealOnScroll } from '../components/animation/RevealOnScroll'
import { HeadingText } from '../components/animation/HeadingText'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function About() {
  useDocumentTitle('About')
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="relative min-h-screen fc-app-bg overflow-x-hidden flex flex-col justify-between selection:bg-surface selection:text-black">
      {/* Navigation */}
      <PublicNavbar />

      {/* Main Content Wrapper with top padding for fixed header */}
      <div className="flex-grow pt-28 pb-16">
        
        {/* ── SECTION 1 — Hero ───────────────────────────────────── */}
        <section id="about" className="py-20 relative overflow-hidden scroll-mt-24 md:scroll-mt-28">
          <div className="absolute top-[20%] left-[-10%] w-[50%] h-[40vh] rounded-full blur-[140px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(249, 115, 22,0.15) 0%, transparent 70%)' }} />
          
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
            <RevealOnScroll>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[11px] font-bold text-[#FB923C] uppercase tracking-wider">
                About FaceCloud
              </span>
            </RevealOnScroll>

            <RevealOnScroll delay={0.05}>
              <h1 className="text-4xl sm:text-6xl font-medium text-ink tracking-tight leading-[1.15]" style={{ fontFamily: "'Space Mono', serif" }}>
                <HeadingText text={'Built to bring [order] to\nfacial image data'} />
              </h1>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <p className="text-sm sm:text-base text-ink-mute max-w-2xl mx-auto font-medium leading-relaxed">
                We built FaceCloud because manual folder sorting, dark or poor-quality photos, and duplicate identity directories were consistently slowing down vision teams. As developers working with massive biometric datasets, we needed a robust ingestion node that could automate enhancement, validate alignment ratios, and cluster identities in a single pass—without compromising security.
              </p>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── SECTION 2 — Mission / Dataset Challenge ───────────── */}
        <section className="py-16 border-y border-ink/[0.05] bg-ink/[0.03]">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <RevealOnScroll>
                <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">Our Mission</span>
              </RevealOnScroll>
              <RevealOnScroll delay={0.05}>
                <h2 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight" style={{ fontFamily: "'Space Mono', serif" }}>
                  <HeadingText text="Solving the Dataset [Challenge]" />
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={0.1}>
                <p className="text-xs text-ink-mute leading-relaxed font-medium">
                  We believe that automated AI models are only as good as the images they ingest. By integrating state-of-the-art low-light enhancement (Zero-DCE) with dynamic clustering models, we ensure that every face entering your database passes standard biometric validation thresholds before it clutters your backend schemas.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={0.15}>
                <div className="pt-2">
                  <a href="/#features" className="text-[11px] font-bold text-[#FB923C] hover:text-ink transition-colors inline-flex items-center gap-1">
                    Explore our processing pipeline &rarr;
                  </a>
                </div>
              </RevealOnScroll>
            </div>

            <div className="md:col-span-5">
              <RevealOnScroll delay={0.1}>
                <div className="fc-panel p-6 bg-ink/[0.04] border border-ink/[0.08] relative overflow-hidden rounded-2xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#F97316]/10 to-[#EA580C]/10 blur-xl rounded-full" />
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Target Metrics</h3>
                  <div className="space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between border-b border-ink/[0.05] pb-1.5">
                      <span className="text-ink-mute">Processing Speed</span>
                      <span className="text-[var(--s-ok)] font-bold">&lt; 150ms / frame</span>
                    </div>
                    <div className="flex justify-between border-b border-ink/[0.05] pb-1.5">
                      <span className="text-ink-mute">Clustering Accuracy</span>
                      <span className="text-[var(--s-ok)] font-bold">99.8% Indexing</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-mute">Low-light Recovery</span>
                      <span className="text-[var(--s-ok)] font-bold">+2.4 EV Boost</span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ── SECTION 3 — How We Work ───────────────────────────── */}
        <section className="py-20 max-w-5xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <RevealOnScroll>
              <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">Core Values</span>
            </RevealOnScroll>
            <RevealOnScroll delay={0.05}>
              <h2 className="text-3xl font-medium text-ink tracking-tight" style={{ fontFamily: "'Space Mono', serif" }}>
                <HeadingText text="How We [Operate]" />
              </h2>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealOnScroll delay={0.05}>
              <div className="fc-panel p-6 flex flex-col justify-between h-full bg-ink/[0.04] border border-ink/[0.06] rounded-2xl hover:border-ink/15 transition-all">
                <div className="space-y-4">
                  <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20 text-[#FB923C]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Automation with Control</h3>
                  <p className="text-xs text-ink-mute leading-relaxed font-medium">
                    Automating bulk uploads is only safe if you can override errors. Our human-in-the-loop review queue gives moderators complete authority to override automatic quality flags.
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="fc-panel p-6 flex flex-col justify-between h-full bg-ink/[0.04] border border-ink/[0.06] rounded-2xl hover:border-ink/15 transition-all">
                <div className="space-y-4">
                  <div className="w-9 h-9 rounded-xl bg-[#EA580C]/10 flex items-center justify-center border border-[#EA580C]/20 text-[#A78BFA]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Security by Default</h3>
                  <p className="text-xs text-ink-mute leading-relaxed font-medium">
                    All biometric assets are encrypted at rest using AES-256 storage buffers, governed by strict JSON Web Token authorization schemas and explicit role-based access rules.
                  </p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.15}>
              <div className="fc-panel p-6 flex flex-col justify-between h-full bg-ink/[0.04] border border-ink/[0.06] rounded-2xl hover:border-ink/15 transition-all">
                <div className="space-y-4">
                  <div className="w-9 h-9 rounded-xl bg-[var(--s-ok)]/10 flex items-center justify-center border border-[var(--s-ok)]/20 text-[var(--s-ok)]">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Built with a Partner</h3>
                  <p className="text-xs text-ink-mute leading-relaxed font-medium">
                    Developed in deep partnership with Datamart, our platform is designed around real production bottlenecks and actual ingest pipelines, not just theoretical benchmarks.
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ── SECTION 4 — Team ──────────────────────────────────── */}
        <section className="py-20 bg-ink/[0.03] border-t border-ink/[0.05]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14 space-y-3">
              <RevealOnScroll>
                <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">The Founders</span>
              </RevealOnScroll>
              <RevealOnScroll delay={0.05}>
                <h2 className="text-3xl font-medium text-ink tracking-tight" style={{ fontFamily: "'Space Mono', serif" }}>
                  <HeadingText text="Meet the [Team]" />
                </h2>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <RevealOnScroll delay={0.05}>
                <div className="fc-panel p-6 flex flex-col items-center text-center space-y-4 rounded-2xl bg-ink/[0.04] border border-ink/[0.06]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-xs font-bold text-white tracking-wider shadow-[0_4px_16px_rgba(249, 115, 22,0.25)]">
                    A.C.
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Ali Chaudhry</h3>
                    <p className="text-[10px] text-ink-faint font-semibold mt-0.5">Co-Founder &amp; Lead Architect</p>
                  </div>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={0.1}>
                <div className="fc-panel p-6 flex flex-col items-center text-center space-y-4 rounded-2xl bg-ink/[0.04] border border-ink/[0.06]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EA580C] to-[var(--s-ok)] flex items-center justify-center text-xs font-bold text-white tracking-wider shadow-[0_4px_16px_rgba(234, 88, 12,0.25)]">
                    M.F.
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Maria F.</h3>
                    <p className="text-[10px] text-ink-faint font-semibold mt-0.5">Co-Founder &amp; Product Lead</p>
                  </div>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={0.15}>
                <div className="fc-panel p-6 flex flex-col items-center text-center space-y-4 rounded-2xl bg-ink/[0.04] border border-ink/[0.06]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--s-ok)] to-[#F97316] flex items-center justify-center text-xs font-bold text-white tracking-wider shadow-[0_4px_16px_rgba(79,255,176,0.25)]">
                    D.S.
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">David S.</h3>
                    <p className="text-[10px] text-ink-faint font-semibold mt-0.5">Security Architect</p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ── SECTION 5 — Final CTA Band ────────────────────────── */}
        <section className="py-24 relative overflow-hidden flex flex-col items-center border-t border-ink/[0.05]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[130px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, #F97316 0%, #EA580C 100%)' }} />

          <RevealOnScroll>
            <div className="max-w-4xl mx-auto px-6 text-center space-y-7 flex flex-col items-center relative z-10">
              <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">Ingestion Suite</span>
              <h2
                className="text-4xl sm:text-5xl font-medium text-ink leading-tight tracking-tight"
                style={{ fontFamily: "'Space Mono', serif" }}
              >
                <HeadingText text={'Ready to enhance, validate, and\norganize facial images [with AI?]'} />
              </h2>
              <p className="text-xs text-ink-mute max-w-md mx-auto leading-relaxed font-medium">
                Start with the user portal to enhance and organize your facial image datasets.
              </p>
              <div className="flex justify-center pt-2">
                <Link to="/login" className="fc-btn-primary font-bold px-8 py-4 cursor-pointer">Start as User</Link>
              </div>
            </div>
          </RevealOnScroll>
        </section>

      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  )
}
