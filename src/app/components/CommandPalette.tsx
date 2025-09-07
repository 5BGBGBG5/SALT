"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Building2, Bot, FileBarChart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const N8N_INGEST_WEBHOOK = process.env.NEXT_PUBLIC_N8N_INGEST_URL!;

// Helper functions
function sanitize(n: string){ return n.replace(/[^a-z0-9.\-_]/gi, '_'); }
function guessTitle(n: string){ return n.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim(); }
function guessCompetitor(s = ''){
  const known = ['NetSuite','Aptean','JustFood','Deacom','Infor','Sage','Epicor'];
  return known.find(k => new RegExp(k, 'i').test(s)) || '';
}

function parseFlagsAndFreeText(s: string){
  const take = (re: RegExp) => { const m = s.match(re); return m ? (m[1] || m[2] || '') : ''; };
  const text = take(/--text=(?:"([^"]+)"|([^\s]+))/i);
  const title = take(/--title=(?:"([^"]+)"|([^\s]+))/i);
  const competitor = take(/--competitor=(\S+)/i);
  const verts = (take(/--verticals=([^\s]+)/i) || '').split(',').map(v=>v.trim()).filter(Boolean);
  const verified = /--verified\b/i.test(s);
  const risk = (take(/--risk=(low|med|high)/i) || 'low').toLowerCase();

  const cleaned = s
    .replace(/--text=(?:"[^"]+"|\S+)/i,'')
    .replace(/--title=(?:"[^"]+"|\S+)/i,'')
    .replace(/--competitor=\S+/i,'')
    .replace(/--verticals=\S+/i,'')
    .replace(/--verified\b/i,'')
    .replace(/--risk=(low|med|high)/i,'')
    .trim();

  return { flags: { text, title, competitor, verticals: verts, verified, risk }, freeText: cleaned };
}

async function pickFile(selector = '#ragBattleFile'): Promise<File|null>{
  return new Promise(resolve => {
    const input = document.querySelector<HTMLInputElement>(selector)!;
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

interface Suggestion {
  icon: React.ReactNode;
  text: string;
  action: () => void;
}

export default function CommandPalette() {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions: Suggestion[] = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "Show me this week's engagement metrics",
      action: () => console.log('Show engagement metrics')
    },
    {
      icon: <Building2 className="w-4 h-4" />,
      text: "Which companies engaged with our content?",
      action: () => console.log('Show company engagement')
    },
    {
      icon: <Bot className="w-4 h-4" />,
      text: "How is Inecta performing in AI responses?",
      action: () => console.log('Show AI performance')
    },
    {
      icon: <FileBarChart className="w-4 h-4" />,
      text: "Generate weekly performance report",
      action: () => console.log('Generate report')
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to clear and blur
      if (e.key === 'Escape') {
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsTyping(true);
    
    // Reset typing indicator after user stops typing
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleAddToBattle = async (raw: string) => {
    setIsProcessing(true);
    try {
      const { flags, freeText } = parseFlagsAndFreeText(raw);
      const text = (flags.text || freeText || '').trim();

      // TEXT path
      if (text) {
        await fetch(N8N_INGEST_WEBHOOK, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'text',
            text,
            source: {
              source_type: 'battle_card',
              title: flags.title || text.slice(0,80),
              competitor: flags.competitor || guessCompetitor(flags.title || text),
              verticals: flags.verticals || [],
              verified: !!flags.verified,
              risk_level: flags.risk || 'low',
              owner: 'marketing'
            }
          })
        });
        console.log('✅ Text sent for indexing');
        return;
      }

      // FILE path
      const file = await pickFile();
      if (!file) return;

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id || 'anon';
      const path = `${userId}/${Date.now()}_${sanitize(file.name)}`;

      const up = await supabase.storage.from('kb-uploads').upload(path, file, { upsert: false });
      if (up.error) throw up.error;

      const signed = await supabase.storage.from('kb-uploads').createSignedUrl(path, 3600);
      if (signed.error) throw signed.error;

      await fetch(N8N_INGEST_WEBHOOK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'file',
          signed_url: signed.data.signedUrl,
          file: { bucket: 'kb-uploads', path, name: file.name, mime: file.type || 'application/octet-stream' },
          source: {
            source_type: 'battle_card',
            title: flags.title || guessTitle(file.name),
            competitor: flags.competitor || guessCompetitor(file.name),
            verticals: flags.verticals || [],
            url: signed.data.signedUrl,
            verified: !!flags.verified,
            risk_level: flags.risk || 'low',
            owner: 'marketing'
          }
        })
      });
      console.log('✅ File uploaded and sent for indexing');
    } catch (error) {
      console.error('❌ Error processing /addtobattle:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = query.trim();
    if (!input || isProcessing) return;

    const [cmd, ...rest] = input.split(/\s+/);
    if (cmd === '/addtobattle') {
      await handleAddToBattle(rest.join(' '));
      setQuery('');
      return;
    }

    // Handle other commands or normal search here
    console.log('Normal search/command:', input);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    suggestion.action();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <input id="ragBattleFile" type="file" accept=".pdf,.docx,.md,.txt" hidden />
        <div className="glass-card overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <div className="relative flex items-center">
            <Search className={`absolute left-6 w-5 h-5 transition-colors duration-300 ${
              isTyping ? 'text-teal-400' : isProcessing ? 'text-yellow-400' : 'text-gray-400'
            }`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              className="w-full pl-14 pr-6 py-6 text-lg outline-none bg-transparent text-white placeholder-gray-400 font-medium disabled:opacity-50"
              placeholder="Ask a question, search, or try /addtobattle..."
              autoFocus
            />
            {(isTyping || isProcessing) && (
              <div className="absolute right-6 flex items-center">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isProcessing ? 'bg-yellow-400' : 'bg-teal-400'
                }`}></div>
              </div>
            )}
          </div>

        <div className="border-t border-teal-500/20">
          <div className="p-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-4 px-4 py-4 text-left rounded-lg hover:bg-teal-500/10 transition-all duration-300 group transform hover:scale-[1.01]"
              >
                <span className="text-teal-400/60 group-hover:text-teal-400 transition-colors duration-300 flex-shrink-0">
                  {suggestion.icon}
                </span>
                <span className="text-gray-300 group-hover:text-white transition-colors duration-300 font-medium">
                  {suggestion.text}
                </span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-6 h-6 rounded-full border border-teal-400/30 flex items-center justify-center">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      </form>

      <div className="flex justify-center gap-8 mt-8 text-gray-400 text-sm">
        <div className="flex items-center gap-2 group">
          <kbd className="glass-card px-3 py-1.5 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">⌘K</kbd>
          <span className="group-hover:text-gray-300 transition-colors">Quick search</span>
        </div>
        <div className="flex items-center gap-2 group">
          <kbd className="glass-card px-3 py-1.5 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">⌘/</kbd>
          <span className="group-hover:text-gray-300 transition-colors">AI assist</span>
        </div>
        <div className="flex items-center gap-2 group">
          <kbd className="glass-card px-3 py-1.5 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">ESC</kbd>
          <span className="group-hover:text-gray-300 transition-colors">Clear</span>
        </div>
      </div>
    </div>
  );
}
