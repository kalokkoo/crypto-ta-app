import { useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { generateAnalysisReport } from '../lib/analysisEngine';

export default function AiAnalysisPanel({ symbolLabel, interval, indicators, supportResistance, signals, oi, fundingRate, fearGreed }) {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  async function run() {
    if (loading || !indicators) return;
    setLoading(true);
    
    // We generate the markdown text first to send as prompt
    const reportText = generateAnalysisReport(symbolLabel, interval, indicators, supportResistance, signals, oi, fundingRate, fearGreed);
    
    // Fallback if no backend
    // setTimeout(() => {
    //   setOutput(reportText);
    //   setLoading(false);
    // }, 500);

    // Call API
    try {
      setOutput('');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `請作為資深的加密貨幣交易員，根據以下技術分析報告提供更深入的市場洞察、潛在風險與交易策略建議。\n\n${reportText}` })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Server error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop(); // keep the last partial line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'content_block_delta' && data.delta?.text) {
                setOutput(prev => prev + data.delta.text);
              }
            } catch (e) {
              // Ignore partial JSON errors
            }
          }
        }
      }
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-area">
      <button className="analyze-btn" onClick={run} disabled={loading || !indicators}>
        {loading ? <><RefreshCw size={15} className="spin" /> 分析中...</> : <><FileText size={15} /> {output ? '重新分析' : '產生技術分析報告'}</>}
      </button>
      <div className="ai-output">
        {output ? <pre className="ai-text">{output}</pre> : <span className="placeholder-text">點擊上方按鈕產生完整技術分析報告，整合恐懼貪婪指數、OI、資金費率、CVD 等多維度數據。</span>}
      </div>
    </div>
  );
}
