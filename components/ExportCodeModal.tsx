import { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';

export default function ExportCodeModal({ 
  isOpen, 
  onClose, 
  elements, 
  variables,
  slug
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  elements: any[], 
  variables: any[],
  slug: string
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'react'>('json');

  if (!isOpen) return null;

  const jsonCode = JSON.stringify({ elements, variables }, null, 2);

  const reactCode = `import Renderer from "@/components/Renderer";

export default function Page() {
  const pageData = ${JSON.stringify({ elements, variables }, null, 2).split('\n').join('\n  ')};

  return (
    <div className="min-h-screen bg-gray-50">
      <Renderer 
        elements={pageData.elements} 
        variables={pageData.variables} 
        slug="${slug}" 
      />
    </div>
  );
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === 'json' ? jsonCode : reactCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(activeTab === 'json' ? jsonCode : reactCode);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", activeTab === 'json' ? `${slug}-data.json` : `${slug}-page.tsx`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-800">Export Source Code</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors">
             <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-zinc-200 px-6 pt-4 gap-4 bg-zinc-50">
          <button 
            onClick={() => setActiveTab('json')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'json' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            JSON Configuration
          </button>
          <button 
            onClick={() => setActiveTab('react')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'react' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            React Component
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto bg-zinc-950 text-zinc-300 font-mono text-sm relative">
          <button 
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded text-white backdrop-blur-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <pre className="whitespace-pre-wrap break-all">
            {activeTab === 'json' ? jsonCode : reactCode}
          </pre>
        </div>

        <div className="p-4 border-t border-zinc-200 flex justify-end bg-zinc-50 rounded-b-xl gap-3">
           <button 
              onClick={onClose}
              className="px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors"
           >
              Close
           </button>
           <button 
              onClick={handleDownload}
              className="px-5 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
           >
              Download {activeTab === 'json' ? '.json' : '.tsx'} File
           </button>
        </div>
      </div>
    </div>
  );
}
