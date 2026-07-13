import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockApiEndpoints } from '../../data/mock'
import { Play, RotateCcw, FileCode } from 'lucide-react'

export default function ApiTest() {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE'>('POST')
  const [path, setPath] = useState('/api/auth/login')
  const [reqBody, setReqBody] = useState(mockApiEndpoints[0].requestBody || '')
  const [resStatus, setResStatus] = useState<string>('')
  const [resTime, setResTime] = useState<string>('')
  const [resBody, setResBody] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const selectPreset = (idx: number) => {
    const ep = mockApiEndpoints[idx]
    if (!ep) return
    setMethod(ep.method)
    setPath(ep.path)
    setReqBody(ep.requestBody || '')
    setResStatus('')
    setResTime('')
    setResBody('')
  }

  const handleSend = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)

    // Lookup matching mock response
    const ep = mockApiEndpoints.find(e => e.path === path && e.method === method)
    if (ep) {
      setResStatus('200 OK')
      setResTime(`${Math.floor(Math.random() * 20) + 8}ms`)
      setResBody(ep.responseExample)
    } else {
      setResStatus('404 Not Found')
      setResTime('4ms')
      setResBody(JSON.stringify({ success: false, error: 'Endpoint path mock mapping not found' }, null, 2))
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="Test API Endpoints"
        subtitle="Verify JSON response structures dynamically using mock request headers."
      />

      {/* Presets Row */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">API Endpoint Presets</label>
        <div className="flex flex-wrap gap-2.5">
          {mockApiEndpoints.map((ep, idx) => (
            <button 
              key={idx}
              onClick={() => selectPreset(idx)}
              className="py-2 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs font-bold text-white/60 hover:border-[#0084FF]/40 hover:text-[#60B1FF] transition-all cursor-pointer"
            >
              {ep.method} {ep.path}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Request Form */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Request Settings" subtitle="Configure request payload parameters">
            <div className="space-y-4">
              
              <div className="grid grid-cols-12 gap-3">
                {/* Method selection */}
                <div className="col-span-4">
                  <select 
                    value={method} 
                    onChange={e => setMethod(e.target.value as any)}
                    className="fc-input !py-3 !px-2 text-xs text-white"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="GET" className="bg-[#05070A] text-white">GET</option>
                    <option value="POST" className="bg-[#05070A] text-white">POST</option>
                    <option value="PATCH" className="bg-[#05070A] text-white">PATCH</option>
                    <option value="DELETE" className="bg-[#05070A] text-white">DELETE</option>
                  </select>
                </div>
                {/* Path input */}
                <div className="col-span-8">
                  <input 
                    type="text" 
                    value={path}
                    onChange={e => setPath(e.target.value)}
                    className="fc-input !py-3 text-xs"
                    placeholder="/api/images/upload"
                  />
                </div>
              </div>

              {/* Request body text area */}
              {method !== 'GET' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">JSON Request Body</label>
                  <textarea 
                    value={reqBody}
                    onChange={e => setReqBody(e.target.value)}
                    className="w-full h-40 font-mono text-[10px] bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-[#0084FF] focus:border-[#0084FF]"
                    placeholder="{}"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={handleSend}
                  className="fc-btn-primary w-full justify-center text-xs py-3.5"
                  disabled={loading}
                >
                  <Play className="w-4 h-4" /> {loading ? 'Request active...' : 'Send Request'}
                </button>
              </div>

            </div>
          </ChartCard>
        </div>

        {/* Right Column: Response Viewer */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Response Payload" subtitle="Returned JSON structure mapping">
            {!resStatus ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-white/40 gap-2">
                <FileCode className="w-8 h-8 text-white/20" />
                <p className="text-xs font-semibold">Ready to trigger mock endpoints.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Stats */}
                <div className="flex justify-between items-center text-xs text-white/50 border-b border-white/10 pb-3">
                  <div className="flex gap-4">
                    <span>Status: <strong className={resStatus.startsWith('2') ? 'text-[#4FFFB0]' : 'text-[#F87171]'}>{resStatus}</strong></span>
                    <span>Latency: <strong className="text-white">{resTime}</strong></span>
                  </div>
                  <button onClick={() => { setResStatus(''); setResBody(''); }} className="p-1 hover:bg-white/5 rounded-lg">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Body code blocks */}
                <pre className="w-full h-56 font-mono text-[9px] bg-black/40 border border-white/5 rounded-2xl p-4 overflow-auto text-[#4FFFB0]">
                  {resBody}
                </pre>

              </div>
            )}
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
