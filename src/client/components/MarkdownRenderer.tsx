import { useMemo } from 'preact/hooks';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import 'highlight.js/styles/github-dark.css';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
// Register plaintext as a pass-through language for highlight.js
hljs.registerLanguage('plaintext', () => ({ contains: [] }));

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Sanitize HTML to prevent XSS
function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderedHtml = useMemo(() => {
    const renderer = new marked.Renderer();

    // Custom code block rendering with syntax highlighting
    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      const validLanguage = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(text, { language: validLanguage }).value;
      return `<pre class="hljs overflow-x-auto"><code class="language-${validLanguage}">${highlighted}</code></pre>`;
    };

    // Custom inline code
    renderer.codespan = ({ text }: { text: string }) => {
      return `<code class="inline-code">${sanitizeHtml(text)}</code>`;
    };

    // Custom link rendering - open in new tab
    renderer.link = ({ href, title, tokens }: { href: string; title?: string; tokens: any[] }) => {
      const text = tokens.map(t => 'text' in t ? t.text : '').join('');
      const titleAttr = title ? ` title="${sanitizeHtml(title)}"` : '';
      return `<a href="${sanitizeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer" class="markdown-link">${text}</a>`;
    };

    try {
      return marked.parse(content, { renderer, gfm: true, breaks: true });
    } catch (err) {
      console.error('Markdown parsing error:', err);
      return sanitizeHtml(content);
    }
  }, [content]);

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

export default MarkdownRenderer;
