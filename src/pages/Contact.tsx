import { useState, useEffect } from 'react'
import { Mail, ShieldCheck, HelpCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { PublicNavbar } from '../components/public/PublicNavbar'
import { PublicFooter } from '../components/public/PublicFooter'
import { ExploreLinks } from '../components/public/ExploreLinks'
import { RevealOnScroll } from '../components/animation/RevealOnScroll'
import { HeadingText } from '../components/animation/HeadingText'
import { USE_API } from '../lib/api/config'
import { apiFetch, ApiError } from '../lib/api/client'

interface FormFields {
  name: string
  email: string
  company: string
  reason: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  reason?: string
  message?: string
}

export default function Contact() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    company: '',
    reason: '',
    message: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!fields.name.trim()) {
      newErrors.name = 'Please enter your name.'
    }
    
    if (!fields.email.trim()) {
      newErrors.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      newErrors.email = 'Please enter a valid email address.'
    }
    
    if (!fields.reason) {
      newErrors.reason = 'Please select a reason for contacting us.'
    }
    
    if (!fields.message.trim()) {
      newErrors.message = 'Please write a message.'
    } else if (fields.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setStatus('submitting')
    setSubmitError('')

    /* Against the API the message really goes to the backend, which answers 503 when no recipient is set up
       and 429 when someone sends too many; those words are shown as they are. The demo keeps its simulation. */
    if (USE_API) {
      try {
        await apiFetch('/api/contact/', {
          anonymous: true,
          body: {
            name: fields.name.trim(), email: fields.email.trim(), company: fields.company.trim(),
            reason: fields.reason, message: fields.message.trim(), website: '',
          },
        })
        setStatus('success')
        setFields({ name: '', email: '', company: '', reason: '', message: '' })
      } catch (err) {
        setSubmitError(err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.')
        setStatus('error')
      }
      return
    }

    try {
      // Log the payload to the console as requested
      console.log('Contact form submission payload:', fields)

      /* 
        TODO: Wire this submit handler to a Supabase table.
        Example configuration:
        
        const { data, error } = await supabase
          .from('contact_submissions')
          .insert([
            { 
              name: fields.name, 
              email: fields.email, 
              company: fields.company || null,
              reason: fields.reason, 
              message: fields.message,
              created_at: new Date()
            }
          ])
          
        if (error) throw error
      */

      // Mock database insertion delay
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Change to simulated success/failure. You can toggle this for testing errors.
          const simulateSuccess = true 
          if (simulateSuccess) {
            resolve(true)
          } else {
            reject(new Error('Database connectivity issue'))
          }
        }, 1500)
      })

      setStatus('success')
      // Reset form
      setFields({
        name: '',
        email: '',
        company: '',
        reason: '',
        message: '',
      })
    } catch (err) {
      console.error('Contact submission error:', err)
      setStatus('error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    // Clear field-specific error as user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="relative min-h-screen fc-app-bg overflow-x-hidden flex flex-col justify-between selection:bg-surface selection:text-black">
      {/* Top Navbar */}
      <PublicNavbar />

      {/* Main Content with fixed nav padding */}
      <div className="flex-grow pt-28 pb-16">
        
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <section id="contact" className="py-12 text-center max-w-3xl mx-auto px-6 space-y-4 scroll-mt-24 md:scroll-mt-28">
          <RevealOnScroll>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[11px] font-bold text-[#FB923C] uppercase tracking-wider">
              Get in touch
            </span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h1 className="text-4xl sm:text-5xl font-medium text-ink tracking-tight leading-tight" style={{ fontFamily: "'Space Mono', serif" }}>
              <HeadingText text="Let's talk about your image [workflow]" />
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p className="text-xs sm:text-sm text-ink-mute font-medium">
              Questions about FaceCloud, enterprise plans, or integrating with your existing systems—reach out.
            </p>
          </RevealOnScroll>
        </section>

        {/* ── TWO-COLUMN SECTION ─────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
          
          {/* LEFT — Contact Form */}
          <div className="md:col-span-7">
            <RevealOnScroll>
              <div className="fc-panel p-6 sm:p-8 bg-ink/[0.04] border border-ink/[0.06] rounded-2xl">
                
                {status === 'success' ? (
                  <div className="text-center py-10 space-y-6 flex flex-col items-center">
                    <div className="w-14 h-14 bg-[var(--s-ok)]/15 rounded-full flex items-center justify-center border border-[var(--s-ok)]/25 text-[var(--s-ok)]">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Submission Received</h2>
                      <p className="text-xs text-ink-mute max-w-sm mx-auto leading-relaxed">
                        Thanks—we'll get back to you within 1-2 business days. If this is an urgent partner inquiry, please refer to the support channels on the right.
                      </p>
                    </div>
                    <button
                      onClick={() => setStatus('idle')}
                      className="px-6 py-2.5 bg-ink/5 text-ink-soft hover:text-ink border border-ink/10 hover:border-ink/20 rounded-xl text-xs font-semibold tracking-wider transition-all mt-2"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {status === 'error' && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-left">
                        <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#EF4444]">Submission Failed</p>
                          <p className="text-[10px] text-ink-faint leading-relaxed font-medium">
                            {submitError || 'An error occurred while transmitting the contact form. Please try again.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Name Field */}
                    <div className="flex flex-col text-left">
                      <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-ink-mute mb-1.5 block">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={fields.name}
                        onChange={handleChange}
                        disabled={status === 'submitting'}
                        className={`bg-ink/[0.04] border rounded-xl px-4 py-3 text-xs text-ink focus:outline-none focus:border-[#F97316] transition-all ${
                          errors.name ? 'border-red-400/40 focus:border-red-400' : 'border-ink/10'
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <span className="text-[10px] font-medium text-red-400 mt-1 block">
                          {errors.name}
                        </span>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="flex flex-col text-left">
                      <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-ink-mute mb-1.5 block">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={fields.email}
                        onChange={handleChange}
                        disabled={status === 'submitting'}
                        className={`bg-ink/[0.04] border rounded-xl px-4 py-3 text-xs text-ink focus:outline-none focus:border-[#F97316] transition-all ${
                          errors.email ? 'border-red-400/40 focus:border-red-400' : 'border-ink/10'
                        }`}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <span className="text-[10px] font-medium text-red-400 mt-1 block">
                          {errors.email}
                        </span>
                      )}
                    </div>

                    {/* Company Field (Optional) */}
                    <div className="flex flex-col text-left">
                      <label htmlFor="company" className="text-[10px] font-bold uppercase tracking-wider text-ink-mute mb-1.5 block">
                        Company Name <span className="text-ink-faint">(Optional)</span>
                      </label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        value={fields.company}
                        onChange={handleChange}
                        disabled={status === 'submitting'}
                        className="bg-ink/[0.04] border border-ink/10 rounded-xl px-4 py-3 text-xs text-ink focus:outline-none focus:border-[#F97316] transition-all"
                        placeholder="DataMart Inc."
                      />
                    </div>

                    {/* Reason for contact Field */}
                    <div className="flex flex-col text-left">
                      <label htmlFor="reason" className="text-[10px] font-bold uppercase tracking-wider text-ink-mute mb-1.5 block">
                        Reason for Contact <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="reason"
                        name="reason"
                        value={fields.reason}
                        onChange={handleChange}
                        disabled={status === 'submitting'}
                        className={`bg-ink/[0.04] border rounded-xl px-4 py-3 text-xs text-ink-soft focus:outline-none focus:border-[#F97316] transition-all cursor-pointer ${
                          errors.reason ? 'border-red-400/40 focus:border-red-400' : 'border-ink/10'
                        }`}
                      >
                        <option value="" disabled>Select inquiry reason</option>
                        <option value="General question">General question</option>
                        <option value="Enterprise / Datamart partnership">Enterprise / Datamart partnership</option>
                        <option value="Technical support">Technical support</option>
                        <option value="Report an issue">Report an issue</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.reason && (
                        <span className="text-[10px] font-medium text-red-400 mt-1 block">
                          {errors.reason}
                        </span>
                      )}
                    </div>

                    {/* Message Field */}
                    <div className="flex flex-col text-left">
                      <label htmlFor="message" className="text-[10px] font-bold uppercase tracking-wider text-ink-mute mb-1.5 block">
                        Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={fields.message}
                        onChange={handleChange}
                        disabled={status === 'submitting'}
                        className={`bg-ink/[0.04] border rounded-xl px-4 py-3 text-xs text-ink focus:outline-none focus:border-[#F97316] transition-all h-32 resize-none ${
                          errors.message ? 'border-red-400/40 focus:border-red-400' : 'border-ink/10'
                        }`}
                        placeholder="Tell us about your project, team, or specific quality/enhancement needs..."
                      />
                      {errors.message && (
                        <span className="text-[10px] font-medium text-red-400 mt-1 block">
                          {errors.message}
                        </span>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:opacity-95 text-white font-bold uppercase text-[11px] tracking-wider py-4 px-6 rounded-xl transition-all shadow-[0_4px_20px_rgba(249, 115, 22,0.2)]"
                    >
                      {status === 'submitting' ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4.5 w-4.5 text-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing Ingest...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>

                  </form>
                )}

              </div>
            </RevealOnScroll>
          </div>

          {/* RIGHT — Contact Info / Context */}
          <div className="md:col-span-5 space-y-6">
            
            {/* General Card */}
            <RevealOnScroll delay={0.05}>
              <div className="fc-panel p-6 bg-ink/[0.04] border border-ink/[0.06] rounded-2xl space-y-4 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20 text-[#FB923C]">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold text-ink uppercase tracking-wider">General Support</h2>
                  <p className="text-[10px] text-ink-faint leading-relaxed font-semibold">
                    Have questions about setting up datasets or account billing?
                  </p>
                </div>
                <div className="pt-1.5 border-t border-ink/[0.06] flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#FB923C]">ali@facecloudai.com</span>
                  <span className="text-[9px] text-ink-faint font-medium">We typically reply within 1-2 business days.</span>
                </div>
              </div>
            </RevealOnScroll>

            {/* Enterprise Card */}
            <RevealOnScroll delay={0.1}>
              <div className="fc-panel p-6 bg-ink/[0.04] border border-ink/[0.06] rounded-2xl space-y-4 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#EA580C]/10 flex items-center justify-center border border-[#EA580C]/20 text-[#FB923C]">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold text-ink uppercase tracking-wider">Enterprise &amp; Partnerships</h2>
                  <p className="text-[10px] text-ink-faint leading-relaxed font-semibold">
                    Inquiries regarding bulk DataMart integrations and dedicated custom model nodes.
                  </p>
                </div>
                <div className="pt-1.5 border-t border-ink/[0.06] flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#FB923C]">ali@facecloudai.com</span>
                  <span className="text-[9px] text-ink-faint font-medium">Fast-track response channels for production partners.</span>
                </div>
              </div>
            </RevealOnScroll>

            {/* FAQ Redirect Link */}
            <RevealOnScroll delay={0.15}>
              <a
                href="/#faq"
                className="fc-panel p-5 bg-black/30 [html[data-theme=light]_&]:bg-[var(--s-panel)] border border-ink/[0.06] rounded-2xl flex items-center justify-between text-left hover:border-[#F97316]/50 transition-all block cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-[#EA580C]/10 flex items-center justify-center border border-[#EA580C]/20 text-[#F97316] group-hover:bg-[#EA580C]/25 transition-all">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-[11px] font-bold text-ink uppercase tracking-wider group-hover:text-[#F97316] transition-colors">Looking for quick answers?</h2>
                    <p className="text-[9px] text-ink-faint font-medium">Check our FAQ section on the landing page.</p>
                  </div>
                </div>
                <div className="text-[#FB923C] group-hover:text-ink transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            </RevealOnScroll>

          </div>

        </section>
      </div>

      {/* Footer */}
      <ExploreLinks current="/contact" />
      <PublicFooter />
    </div>
  )
}
