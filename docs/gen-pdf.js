const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function main() {
  const mdPath = process.argv[2] || 'ling-api-v1-follow-up.md';
  const pdfPath = mdPath.replace(/\.md$/, '.pdf');
  
  // Read markdown content
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  
  // Simple markdown to HTML conversion
  let html = mdContent
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>');
  
  html = '<p>' + html + '</p>';
  html = html.replace(/<li>(.*?)<\/li>/g, (match, p1) => {
    if (!html.includes('<ul>')) return '<ul><li>' + p1 + '</li></ul>';
    return match;
  });

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Ling API V1.0 技术对接文档 - OPC平台</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #333; }
  h1 { font-size: 18pt; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px; }
  h2 { font-size: 14pt; color: #222; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #555; padding-left: 10px; }
  h3 { font-size: 12pt; color: #333; margin-top: 16px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  tr:nth-child(even) { background: #fafafa; }
  ul { margin: 8px 0; padding-left: 20px; }
  li { margin: 4px 0; }
  p { margin: 8px 0; }
  strong { color: #1a1a1a; }
  .meta { color: #666; font-size: 10pt; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
</style>
</head>
<body>
${html}
<div class="meta">
<p><strong>OPC数字平台</strong> | 技术对接人：团坐009（CEO / 技术架构）</p>
<p>日期：2026-07-07</p>
</div>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true
  });
  await browser.close();
  
  console.log('PDF generated:', pdfPath);
}

main().catch(console.error);
