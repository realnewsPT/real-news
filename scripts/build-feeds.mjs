// Valida o esquema de data/posts.json e data/votacoes.json e ordena por data.
// Corrido pelo workflow semanal, depois de fetch-votacoes.mjs / fetch-noticias.mjs,
// e pode ser corrido localmente antes de um commit manual.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "data", "posts.json");
const VOTACOES_PATH = path.join(ROOT, "data", "votacoes.json");

const VOTOS_VALIDOS = ["A Favor", "Contra", "Abstenção"];
const RESULTADOS_VALIDOS = ["Aprovado", "Rejeitado"];

async function readJSON(filePath) {
  return JSON.parse(await readFile(filePath, "utf-8"));
}

function validarPost(p, i) {
  const erros = [];
  if (!p.id) erros.push("falta id");
  if (!p.data_publicacao) erros.push("falta data_publicacao");
  if (!p.titulo) erros.push("falta titulo");
  if (!p.resumo) erros.push("falta resumo");
  if (!p.fonte?.url) erros.push("falta fonte.url");
  if (erros.length) throw new Error(`posts.json[${i}] (${p.id || "?"}): ${erros.join(", ")}`);
}

function validarVotacao(v, i) {
  const erros = [];
  if (!v.id) erros.push("falta id");
  if (!v.data) erros.push("falta data");
  if (!v.titulo) erros.push("falta titulo");
  if (!RESULTADOS_VALIDOS.includes(v.resultado)) erros.push(`resultado inválido: ${v.resultado}`);
  if (!VOTOS_VALIDOS.includes(v.voto_chega)) erros.push(`voto_chega inválido: ${v.voto_chega}`);
  if (!v.fonte_oficial) erros.push("falta fonte_oficial");
  if (erros.length) throw new Error(`votacoes.json[${i}] (${v.id || "?"}): ${erros.join(", ")}`);
}

async function main() {
  const posts = await readJSON(POSTS_PATH);
  const votacoes = await readJSON(VOTACOES_PATH);

  posts.forEach(validarPost);
  votacoes.forEach(validarVotacao);

  const postsOrdenados = [...posts].sort((a, b) => (a.data_publicacao < b.data_publicacao ? 1 : -1));
  const votacoesOrdenadas = [...votacoes].sort((a, b) => (a.data < b.data ? 1 : -1));

  await writeFile(POSTS_PATH, JSON.stringify(postsOrdenados, null, 2) + "\n", "utf-8");
  await writeFile(VOTACOES_PATH, JSON.stringify(votacoesOrdenadas, null, 2) + "\n", "utf-8");

  console.log(`OK: ${posts.length} posts e ${votacoes.length} votações validados e ordenados.`);
}

main().catch((err) => {
  console.error("Falha na validação:", err.message);
  process.exitCode = 1;
});
