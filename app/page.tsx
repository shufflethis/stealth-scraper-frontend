'use client';

import { useState, useEffect } from 'react';
import { scrape, scrapeAI, getModels, getTemplates, healthCheck, ScrapeResponse } from '@/lib/api';

export default function Home() {
  const [url, setUrl] = useState('');
  const [instruction, setInstruction] = useState('');
  const [goal, setGoal] = useState('');
  const [model, setModel] = useState('kat-coder-pro');
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'simple' | 'ai'>('simple');
  const [models, setModels] = useState<string[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Load models and templates
    getModels().then(r => setModels(r.models)).catch(() => {});
    getTemplates().then(r => setTemplates(r.templates)).catch(() => {});

    // Check API health
    healthCheck().then(ok => setApiStatus(ok ? 'online' : 'offline'));
  }, []);

  const handleScrape = async () => {
    if (!url) {
      setError('Bitte URL eingeben');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response: ScrapeResponse;

      if (mode === 'ai') {
        response = await scrapeAI(url, goal, model);
      } else {
        response = await scrape({
          url,
          instruction: template || instruction,
          template: template || undefined,
          model,
        });
      }

      setResult(response);
    } catch (e: any) {
      setError(e.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    if (!result?.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrape_${Date.now()}.json`;
    a.click();
  };

  const downloadCSV = () => {
    if (!result?.data || !Array.isArray(result.data)) return;
    const headers = Object.keys(result.data[0] || {});
    const csv = [
      headers.join(','),
      ...result.data.map((row: any) => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrape_${Date.now()}.csv`;
    a.click();
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            🕵️ StealthScraper
          </h1>
          <p className="text-gray-400">Camoufox + AI-powered Data Extraction</p>

          {/* API Status */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500 pulse-glow' :
              apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm text-gray-400">
              API: {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Prüfe...'}
            </span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setMode('simple')}
            className={`px-6 py-2 rounded-lg transition-all ${
              mode === 'simple'
                ? 'bg-cyber-blue text-black font-semibold'
                : 'bg-cyber-card cyber-border text-gray-300 hover:bg-gray-800'
            }`}
          >
            🌐 Einfach
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`px-6 py-2 rounded-lg transition-all ${
              mode === 'ai'
                ? 'bg-cyber-purple text-white font-semibold'
                : 'bg-cyber-card cyber-border text-gray-300 hover:bg-gray-800'
            }`}
          >
            🤖 AI-gesteuert
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-cyber-card cyber-border rounded-xl p-6 mb-6">
          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.flytap.com/de-de/stopover"
              className="w-full bg-cyber-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none transition-colors"
            />
          </div>

          {mode === 'simple' ? (
            <>
              {/* Template Select */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Template (optional)</label>
                <select
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  className="w-full bg-cyber-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none"
                >
                  <option value="">Benutzerdefiniert</option>
                  {templates.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Instruction */}
              {!template && (
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Was extrahieren?</label>
                  <textarea
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    placeholder="Extrahiere alle Flugpreise mit Datum, Abflugort und Ziel..."
                    rows={3}
                    className="w-full bg-cyber-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none resize-none"
                  />
                </div>
              )}
            </>
          ) : (
            /* AI Mode */
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Was möchtest du erreichen?</label>
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="Finde alle Flüge von Frankfurt nach Brasilien mit Stopover in Lissabon, zeige Preise und Daten..."
                rows={4}
                className="w-full bg-cyber-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Model Select */}
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">Modell</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full bg-cyber-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyber-blue focus:outline-none"
            >
              {models.map(m => (
                <option key={m} value={m}>
                  {m} {m.includes('free') || m === 'kat-coder-pro' ? '(FREE)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleScrape}
            disabled={loading || apiStatus === 'offline'}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
              loading || apiStatus === 'offline'
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white hover:opacity-90 cyber-glow'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="loader" style={{ width: 24, height: 24, borderWidth: 2 }} />
                Scraping läuft...
              </span>
            ) : (
              '🚀 Scrapen'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Results */}
        {result && result.success && (
          <div className="bg-cyber-card cyber-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold gradient-text">📊 Ergebnisse</h2>
              <div className="flex gap-2">
                <button
                  onClick={downloadJSON}
                  className="px-4 py-2 bg-cyber-dark border border-gray-700 rounded-lg text-sm hover:border-cyber-blue transition-colors"
                >
                  📥 JSON
                </button>
                {Array.isArray(result.data) && (
                  <button
                    onClick={downloadCSV}
                    className="px-4 py-2 bg-cyber-dark border border-gray-700 rounded-lg text-sm hover:border-cyber-blue transition-colors"
                  >
                    📥 CSV
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mb-4 text-sm text-gray-400">
              {result.tokens_used && <span>🎯 {result.tokens_used} Tokens</span>}
              {result.model && <span>🤖 {result.model}</span>}
              {result.scraped_at && <span>🕐 {new Date(result.scraped_at).toLocaleTimeString()}</span>}
            </div>

            {/* Data Table or JSON */}
            {Array.isArray(result.data) && result.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {Object.keys(result.data[0]).map(key => (
                        <th key={key} className="text-left py-2 px-3 text-cyber-blue font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="py-2 px-3 text-gray-300">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="bg-cyber-dark rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-2">Schnelllinks:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: 'TAP Stopover', url: 'https://www.flytap.com/de-de/stopover' },
              { name: 'Iberia', url: 'https://www.iberia.com/de/' },
              { name: 'Emirates', url: 'https://www.emirates.com/de/german/' },
            ].map(link => (
              <button
                key={link.name}
                onClick={() => setUrl(link.url)}
                className="px-3 py-1 text-sm bg-cyber-dark border border-gray-700 rounded-full hover:border-cyber-blue transition-colors"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          StealthScraper v1.0 | Powered by Camoufox + OpenRouter
        </footer>
      </div>
    </main>
  );
}
