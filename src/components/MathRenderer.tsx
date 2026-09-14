import React, { useRef, useEffect } from "react";

/**
 * MathRenderer — Component render nội dung chứa công thức MathJax
 * 
 * Hỗ trợ:
 * - Inline math: \(...\) hoặc $...$
 * - Block math: \[...\] hoặc $$...$$
 * - Markdown cơ bản: **bold**, *italic*, bullet lists, code blocks
 * 
 * Chữ đen, nền trắng theo yêu cầu user.
 */

interface MathRendererProps {
  content: string;
  className?: string;
}

/** Convert basic Markdown to HTML */
const markdownToHtml = (text: string): string => {
  let html = text;

  // Preserve block math ($$...$$) and (\[...\]) by replacing them with placeholders
  const blockMathPlaceholders: string[] = [];
  // $$...$$ blocks
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    const idx = blockMathPlaceholders.length;
    blockMathPlaceholders.push(`\\[${formula}\\]`);
    return `%%BLOCKMATH_${idx}%%`;
  });

  // Preserve inline math ($...$) by replacing them with placeholders
  const inlineMathPlaceholders: string[] = [];
  // $...$ inline (single $ not preceded/followed by space for ambiguity reduction)
  html = html.replace(/\$([^\$\n]+?)\$/g, (_match, formula) => {
    const idx = inlineMathPlaceholders.length;
    inlineMathPlaceholders.push(`\\(${formula}\\)`);
    return `%%INLINEMATH_${idx}%%`;
  });

  // Escape HTML entities (but not our placeholders or existing \( \) \[ \] )
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="math-code-block"><code>$2</code></pre>');

  // Inline code (`)
  html = html.replace(/`([^`]+)`/g, '<code class="math-inline-code">$1</code>');

  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Headers (### text)
  html = html.replace(/^### (.+)$/gm, '<h4 class="math-heading">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="math-heading">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="math-heading">$1</h2>');

  // Bullet lists (- item or * item)
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="math-list-item">$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(
    /(<li class="math-list-item">[\s\S]*?<\/li>\n?)+/g,
    '<ul class="math-list">$&</ul>'
  );

  // Numbered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="math-list-item-ol">$1</li>');
  html = html.replace(
    /(<li class="math-list-item-ol">[\s\S]*?<\/li>\n?)+/g,
    '<ol class="math-list-ol">$&</ol>'
  );

  // Paragraphs — double newlines
  html = html.replace(/\n\n/g, "</p><p>");

  // Single newlines → <br>
  html = html.replace(/\n/g, "<br/>");

  // Restore block math placeholders
  blockMathPlaceholders.forEach((formula, idx) => {
    html = html.replace(`%%BLOCKMATH_${idx}%%`, `<div class="math-block">${formula}</div>`);
  });

  // Restore inline math placeholders
  inlineMathPlaceholders.forEach((formula, idx) => {
    html = html.replace(`%%INLINEMATH_${idx}%%`, `<span class="math-inline">${formula}</span>`);
  });

  // Wrap in paragraph
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
};

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger MathJax typesetting after content renders
    if (containerRef.current && (window as any).MathJax) {
      const MathJax = (window as any).MathJax;
      if (MathJax.typesetPromise) {
        MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
          console.warn("MathJax typeset error:", err);
        });
      } else if (MathJax.Hub) {
        // MathJax v2 fallback
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, containerRef.current]);
      }
    }
  }, [content]);

  const html = markdownToHtml(content);

  return (
    <div
      ref={containerRef}
      className={`math-renderer ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
