import { useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { generateAnalysisReport } from '../lib/analysisEngine';

export default function AiAnalysisPanel({ symbolLabel, interval, indicators, supportResistance, signals }) {
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  function runAnalysis() {
    if (isGenerating || !indicators) return;
    setIsGenerating(true);
    setOutput('');

    // 用 setTimeout 模擬短暫計算延遲，讓 UI 有回饋感
    setTimeout(() => {
      const report = generateAnalysisReport(
        symbolLabel,
        interval,
        indicators,
        supportResistance,
        signals
      );
      setOutput(report);
      setIsGenerating(false);
    }, 600);
  }

  return (
    <div className="ai-area">
      <button className="analyze-btn" onClick={runAnalysis} disabled={isGenerating || !indicators}>
        {isGenerating ? (
          <>
            <RefreshCw size={16} className="spin" /> 分析中...
          </>
        ) : (
          <>
            <FileText size={16} /> {output ? '重新產生分析' : '產生技術分析報告'}
          </>
        )}
      </button>
      <div className="ai-output" style={{ fontFamily: 'monospace' }}>
        {output ? (
          <pre className="ai-text">{output}</pre>
        ) : (
          <span className="placeholder-text">
            點擊上方按鈕，系統將根據即時技術指標自動產生完整分析報告，包含趨勢判斷、支撐壓力位、動能分析與操作情境推演。完全免費，無需任何 API 金鑰。
          </span>
        )}
      </div>
    </div>
  );
}
