// Vai buscar candidatos a novas entradas do feed de polémicas a partir de RSS.
// NÃO publica automaticamente: escreve em data/_candidatos.json para revisão humana.
// Corrido pelo workflow semanal (.github/workflows/weekly-update.yml).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCES_PATH = path.join(__dirname, "sources.json");
const CANDIDATOS_PATH = path.join(ROOT, "data", "_candidatos.json");
const POSTS_PATH = path.join(ROOT, "data", "posts.json");

async function readJSON(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function extractItems(xml) {
  const items = [];
  const itemRe = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRe) || [];
  for (const raw of matches) {
    const title = (raw.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .trim();
    const link = (raw.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .trim();
    const pubDate = (raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

function matchesKeywords(title, keywords) {
  const norm = title.toLowerCase();
  return keywords.some((kw) => norm.includes(kw.toLowerCase()));
}

async function main() {
  const sources = await readJSON(SOURCES_PATH, { rss_noticias: [], keywords: [] });
  const posts = await readJSON(POSTS_PATH, []);
  const candidatosExistentes = await readJSON(CANDIDATOS_PATH, []);

  const urlsConhecidos = new Set([
    ...posts.map((p) => p.fonte?.url),
    ...candidatosExistentes.map((c) => c.link),
  ]);

  const novosCandidatos = [];

  for (const fonte of sources.rss_noticias || []) {
    try {
      const res = await fetch(fonte.url, { headers: { "User-Agent": "ObservatorioChegaBot/1.0" } });
      if (!res.ok) {
        console.warn(`Aviso: ${fonte.nome} respondeu ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = extractItems(xml).filter(
        (item) => matchesKeywords(item.title, sources.keywords || []) && !urlsConhecidos.has(item.link)
      );
      for (const item of items) {
        novosCandidatos.push({
          titulo: item.title,
          link: item.link,
          data_deteccao: new Date().toISOString().slice(0, 10),
          fonte: fonte.nome,
          pub_date: item.pubDate || null,
          estado: "por_rever",
        });
        urlsConhecidos.add(item.link);
      }
    } catch (err) {
      console.warn(`Aviso: falha ao processar ${fonte.nome}: ${err.message}`);
    }
  }

  const combinados = [...candidatosExistentes, ...novosCandidatos];
  await writeFile(CANDIDATOS_PATH, JSON.stringify(combinados, null, 2) + "\n", "utf-8");
  console.log(`${novosCandidatos.length} novo(s) candidato(s) escrito(s) em ${path.relative(ROOT, CANDIDATOS_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
