const https = require('https');
const fs = require('fs');

const urls = [
  { id: 'upload_mrv_evidence', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1OWE4NTQ2MWEwODUwODlhZjUxMGQ5MTk2YTczEgsSBxCG-_zKsRoYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjQzMzIwOTQ4MjU2ODA2ODYyMg&filename=&opi=89354086' },
  { id: 'mrv_workspace', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1OWE4MTJkNTI3NmIwMjhmMDk1Njg0MDI1ZGI5EgsSBxCG-_zKsRoYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjQzMzIwOTQ4MjU2ODA2ODYyMg&filename=&opi=89354086' },
  { id: 'project_verification', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1OWE4MDA4NzIzNjEwOTI1YzczMzBmM2E1YzFmEgsSBxCG-_zKsRoYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjQzMzIwOTQ4MjU2ODA2ODYyMg&filename=&opi=89354086' }
];

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseHTML(html) {
  let inBody = false;
  let result = '';
  let i = 0;
  while(i < html.length) {
    if(html.slice(i, i+5).toLowerCase() === '<body') { inBody = true; }
    if(inBody && html.slice(i, i+6).toLowerCase() === '</body') { break; }
    
    if(inBody && html[i] === '<') {
      let end = html.indexOf('>', i);
      if (end === -1) break;
      let tagContent = html.substring(i+1, end);
      let tagName = tagContent.split(' ')[0].toLowerCase();
      
      if(tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'button' || tagName === 'a' || tagName === 'th' || tagName === 'td' || tagName === 'p' || tagName === 'label' || tagName === 'li') {
         result += '\n[' + tagName.toUpperCase() + ']: ';
      } else if (tagName === 'span') {
         if (tagContent.includes('material-symbols-outlined')) {
             let spanEnd = html.indexOf('</span>', end);
             if (spanEnd !== -1) {
                 result += '[ICON:' + html.substring(end+1, spanEnd).trim() + '] ';
                 i = spanEnd + 7;
                 continue;
             }
         } else {
             result += '\n[SPAN]: ';
         }
      } else if (tagName === 'style' || tagName === 'script') {
        let closeTag = '</' + tagName + '>';
        let closeIdx = html.indexOf(closeTag, end);
        if(closeIdx !== -1) {
          i = closeIdx + closeTag.length;
          continue;
        }
      } else if (tagName === 'img') {
          result += '[IMG] ';
      }
      i = end + 1;
    } else if(inBody) {
      if(html[i] !== '\n' && html[i] !== '\r') result += html[i];
      i++;
    } else {
      i++;
    }
  }
  return result.replace(/\s+/g, ' ').replace(/(?:\s*\[(H1|H2|H3|BUTTON|A|TH|TD|P|SPAN|LABEL|LI)\]:\s*)/g, '\n[$1]: ').trim();
}

async function run() {
  const out = [];
  for (const item of urls) {
    try {
      const html = await fetchHTML(item.url);
      fs.writeFileSync(`C:\\Users\\VIRAJ\\.gemini\\antigravity-ide\\brain\\78fb52b7-d374-441a-88eb-1fc81b45d375\\scratch\\${item.id}.html`, html);
      out.push(`--- ${item.id} ---\n${parseHTML(html)}\n`);
    } catch (e) {
      out.push(`Failed to fetch ${item.id}: ${e.message}`);
    }
  }
  fs.writeFileSync('C:\\Users\\VIRAJ\\.gemini\\antigravity-ide\\brain\\78fb52b7-d374-441a-88eb-1fc81b45d375\\scratch\\mrv_parsed.txt', out.join('\n\n'));
}

run();
