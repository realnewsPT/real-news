import { fetchJSON, formatDate, escapeHTML, normalize } from "./utils.js";

const grid = document.getElementById("post-grid");
const inputTexto = document.getElementById("filtro-texto");
const selectCategoria = document.getElementById("filtro-categoria");

let posts = [];

function populateCategorias() {
  const categorias = [...new Set(posts.map((p) => p.categoria).filter(Boolean))].sort();
  for (const cat of categorias) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    selectCategoria.appendChild(opt);
  }
}

function matches(post, texto, categoria) {
  if (categoria && post.categoria !== categoria) return false;
  if (!texto) return true;
  const haystack = normalize(
    [post.titulo, post.resumo, post.pessoa, ...(post.tags || [])].join(" ")
  );
  return haystack.includes(normalize(texto));
}

function renderPost(post) {
  const hasImage = Boolean(post.imagem_preview);
  return `
    <article class="post-card">
      <a class="post-card__link" href="${escapeHTML(post.fonte?.url || "#")}" target="_blank" rel="noopener">
        <div class="post-card__image">
          ${hasImage
            ? `<img src="${escapeHTML(post.imagem_preview)}" alt="" loading="lazy" />`
            : "Sem imagem de pré-visualização"}
        </div>
        <div class="post-card__body">
          <span class="badge">${escapeHTML(post.categoria || "Outro")}</span>
          <h2 class="post-card__title">${escapeHTML(post.titulo)}</h2>
          <p class="post-card__summary">${escapeHTML(post.resumo)}</p>
          <div class="post-card__meta">
            <span>${escapeHTML(post.pessoa || "")}</span>
            <span>${formatDate(post.data_publicacao)}</span>
          </div>
          <div class="post-card__meta">
            <span>Fonte: ${escapeHTML(post.fonte?.nome || "")}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function render() {
  const texto = inputTexto.value.trim();
  const categoria = selectCategoria.value;
  const filtrados = posts
    .filter((p) => matches(p, texto, categoria))
    .sort((a, b) => (a.data_publicacao < b.data_publicacao ? 1 : -1));

  grid.innerHTML = filtrados.length
    ? filtrados.map(renderPost).join("")
    : `<p class="empty-state">Nenhuma entrada encontrada com estes filtros.</p>`;
}

async function init() {
  try {
    posts = await fetchJSON("data/posts.json");
    populateCategorias();
    render();
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Não foi possível carregar os dados. (${escapeHTML(err.message)})</p>`;
  }
}

inputTexto.addEventListener("input", render);
selectCategoria.addEventListener("change", render);

init();
