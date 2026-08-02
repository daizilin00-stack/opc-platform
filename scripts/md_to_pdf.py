import markdown
import weasyprint
import sys

# Read markdown file
input_file = '/Users/celine/.openclaw/workspace/opc-platform/docs/api-service-quotation-complete.md'
output_file = '/Users/celine/Desktop/OPC海外模型API服务报价单.pdf'

with open(input_file, 'r', encoding='utf-8') as f:
    md_content = f.read()

# Convert markdown to HTML
html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])

# Add CSS styling for better PDF output
css_style = """
<style>
    @page { size: A4; margin: 2cm; }
    body { font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif; font-size: 10pt; line-height: 1.6; color: #333; }
    h1 { font-size: 18pt; color: #1a5276; border-bottom: 2px solid #1a5276; padding-bottom: 8px; margin-top: 24px; }
    h2 { font-size: 14pt; color: #2874a6; margin-top: 20px; border-left: 4px solid #2874a6; padding-left: 10px; }
    h3 { font-size: 12pt; color: #2e86c1; margin-top: 16px; }
    h4 { font-size: 11pt; color: #5499c7; margin-top: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
    th { background: #1a5276; color: white; padding: 8px; text-align: left; border: 1px solid #1a5276; }
    td { padding: 6px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #f8f9fa; }
    tr:hover { background: #e8f4f8; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: "SF Mono", "Consolas", monospace; font-size: 9pt; }
    pre { background: #f8f9fa; padding: 12px; border-radius: 5px; overflow-x: auto; border-left: 3px solid #1a5276; }
    blockquote { border-left: 4px solid #1a5276; padding-left: 16px; margin-left: 0; color: #555; background: #f8f9fa; padding: 12px; border-radius: 0 5px 5px 0; }
    strong { color: #1a5276; }
    hr { border: none; border-top: 2px solid #e0e0e0; margin: 20px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
    .highlight { background: #fff3cd; padding: 2px 4px; border-radius: 3px; }
</style>
"""

# Wrap HTML with full structure
full_html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>OPC 海外模型 API 服务报价单</title>
    {css_style}
</head>
<body>
{html_content}
</body>
</html>
"""

# Convert to PDF
weasyprint.HTML(string=full_html).write_pdf(output_file)
print(f"PDF successfully generated: {output_file}")
