// Vai buscar novas votações à openAR API (agregador dos dados abertos oficiais
// da Assembleia da República) e junta-as a data/votacoes.json.
// Dados oficiais e factuais: pode ser semi-automático, mas o resultado deve ser
// validado por amostragem contra parlamento.pt antes de confiar plenamente.
// Corrido pelo workflow semanal (.github/workflows/weekly-update.yml).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCES_PATH = path.join(__dirname, "sources.json");
const VOTACOES_PATH = path.join(ROOT, "data", "votacoes.json");

const CHEGA_LABEL = "CHEGA";

async function readJSON(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

// A openAR API não tem, à data deste script, um formato 100% estável e
// documentado publicamente — este mapeamento é o ponto a ajustar caso a
// estrutura da resposta mude. Ver plan.md secção 4.1.
function normalizeIniciativa(raw) {
  if (!raw?.id || !raw?.votacao) return null;
  const votos = raw.votacao.votos_por_partido || raw.votacao.votos || {};
  return {
    id: String(raw.id),
    data: raw.votacao.data || raw.data || null,
    titulo: raw.titulo || raw.assunto || "(sem título)",
    tipo: raw.tipo || "Iniciativa",
    fase: raw.votacao.fase || "Votação",
    resultado: raw.votacao.resultado || "Desconhecido",
    votos,
    voto_chega: votos[CHEGA_LABEL] || "Desconhecido",
    notas: "",
    fonte_oficial: raw.url_oficial || raw.link || "",
  };
}

async function main() {
  const sources = await readJSON(SOURCES_PATH, {});
  const existentes = await readJSON(VOTACOES_PATH, []);
  const idsExistentes = new Set(existentes.map((v) => v.id));

  if (!sources.votacoes_api_base) {
    console.warn("Sem votacoes_api_base configurado em scripts/sources.json — nada a fazer.");
    return;
  }

  let novas = [];
  try {
    const res = await fetch(`${sources.votacoes_api_base}?limit=20`, {
      headers: { "User-Agent": "ObservatorioChegaBot/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const lista = Array.isArray(payload) ? payload : payload.results || payload.items || [];
    novas = lista
      .map(normalizeIniciativa)
      .filter((v) => v && !idsExistentes.has(v.id) && v.resultado !== "Desconhecido");
  } catch (err) {
    console.warn(`Não foi possível consultar a API de votações (${err.message}).`);
    console.warn("Sem alterações a votacoes.json nesta execução — adicionar manualmente se necessário.");
    return;
  }

  if (!novas.length) {
    console.log("Nenhuma votação nova encontrada.");
    return;
  }

  const combinadas = [...existentes, ...novas];
  await writeFile(VOTACOES_PATH, JSON.stringify(combinadas, null, 2) + "\n", "utf-8");
  console.log(`${novas.length} nova(s) votação(ões) adicionada(s) a ${path.relative(ROOT, VOTACOES_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
