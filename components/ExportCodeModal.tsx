import { useState, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState<'html' | 'json' | 'react'>('html');

  const jsonCode = useMemo(() => JSON.stringify({ elements, variables }, null, 2), [elements, variables]);

  const reactCode = useMemo(() => `import Renderer from "@/components/Renderer";

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
`, [elements, variables, slug]);

  const htmlCode = useMemo(() => {
    const toKebab = (str: string) => str.replace(/[A-Z]/g, match => '-' + match.toLowerCase());
    
    // Simple HTML renderer for basic export
    const renderedElements = elements.map(el => {
      const inlineStyle = Object.entries(el.style || {})
        .map(([k, v]) => `${toKebab(k)}: ${v}`)
        .join('; ');
      
      const customClass = el.customCss || '';
      const idStr = el.customId ? ` id="${el.customId}"` : '';
      const cStyleStr = inlineStyle ? ` style="${inlineStyle}"` : '';
      
      let innerHTML = '';
      if (el.type === 'text') innerHTML = `<p${idStr}${cStyleStr} class="${customClass}">${el.content}</p>`;
      else if (el.type === 'heading') innerHTML = `<h2${idStr} style="${inlineStyle}; font-weight: bold;" class="${customClass}">${el.content}</h2>`;
      else if (el.type === 'button') innerHTML = `<button${idStr}${cStyleStr} class="${customClass}">${el.content}</button>`;
      else if (el.type === 'image') innerHTML = `<img src="${el.content}"${idStr}${cStyleStr} class="object-cover ${customClass}" alt="" />`;
      else if (el.type === 'video') innerHTML = `<div${idStr}${cStyleStr} class="${customClass}"><iframe width="100%" height="100%" src="${el.content}" frameborder="0" allowfullscreen></iframe></div>`;
      else if (el.type === 'card' || el.type === 'section_block') innerHTML = `<div${idStr}${cStyleStr} class="${customClass}">${el.content}</div>`;
      else if (el.type === 'divider') innerHTML = `<hr${idStr}${cStyleStr} class="${customClass}" />`;
      else if (typeof el.content === 'string') innerHTML = `<div${idStr}${cStyleStr} class="${customClass}">${el.content}</div>`;
      else innerHTML = `<div${idStr}${cStyleStr} class="${customClass}">[Dynamic Component: ${el.type}]</div>`;
      
      return `      <!-- Element: ${el.type} -->\n      <div style="position: absolute; left: ${el.position.x}px; top: ${el.position.y}px; z-index: ${el.style?.zIndex || 1};">\n        ${innerHTML}\n      </div>`;
    }).join('\n\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${slug || 'Exported Project'}</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f9fafb;
    }
    .workspace {
      position: relative;
      min-height: 100vh;
      width: 100%;
      overflow-x: hidden;
    }
  </style>
</head>
<body>
  <div class="workspace">
${renderedElements}
  </div>
</body>
</html>`;
  }, [elements, slug]);

  if (!isOpen) return null;

  const currentCode = activeTab === 'html' ? htmlCode : activeTab === 'json' ? jsonCode : reactCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let mimeType = 'text/plain';
    let fileExtension = '.txt';
    
    if (activeTab === 'html') {
      mimeType = 'text/html';
      fileExtension = '.html';
    } else if (activeTab === 'json') {
      mimeType = 'application/json';
      fileExtension = '.json';
    } else if (activeTab === 'react') {
      mimeType = 'text/javascript';
      fileExtension = '.tsx';
    }
    
    const dataStr = `data:${mimeType};charset=utf-8,` + encodeURIComponent(currentCode);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${slug}${fileExtension}`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-800">Export Project</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors">
             <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-zinc-200 px-6 pt-4 gap-4 bg-zinc-50">
          <button 
            onClick={() => setActiveTab('html')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'html' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            HTML / CSS / JS
          </button>
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
            {currentCode}
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
              Download {activeTab === 'html' ? '.html' : activeTab === 'json' ? '.json' : '.tsx'} File
           </button>
        </div>
      </div>
    </div>
  );
}
