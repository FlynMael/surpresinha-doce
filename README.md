# 🧁 Surpresinha Doce — Controle de Custos e Lucro

App simples para a confeitaria **Surpresinha Doce** controlar o preço dos
ingredientes, calcular o custo de cada bolo e saber quanto está lucrando.

👉 **Abrir o app:** https://flynmael.github.io/surpresinha-doce/

## O que dá para fazer

- **Ingredientes** — cadastrar farinha, açúcar, leite… com o preço e a quantidade
  da embalagem (ex.: 5 kg por R$ 25,90). O app calcula sozinho o custo por grama/ml/unidade.
- **Receitas** — montar cada bolo escolhendo os ingredientes e as quantidades usadas,
  somar outros custos (gás, embalagem, mão de obra) e ver o custo total.
- **Lucro** — informar o preço de venda e ver lucro em R$, margem em % e o multiplicador do custo.
- **Preço sugerido** — dizer a margem desejada (ou o multiplicador) e o app diz por quanto vender.
- **Resumo** — comparar o lucro de todas as receitas e ver a margem média.
- **Backup** — baixar e restaurar um arquivo com todos os dados.

## Como usar no celular

1. Abrir o link acima no navegador do celular.
2. Menu do navegador → **"Adicionar à tela inicial"** / **"Instalar app"**.
3. Pronto: vira um ícone e funciona offline.

## Onde ficam os dados

Tudo é salvo **no próprio aparelho** (localStorage do navegador). Nada vai para a internet.
Use o botão **Baixar backup** na aba Resumo de vez em quando.

## Técnico

HTML/CSS/JS puro, arquivo único, sem dependências. PWA com `manifest.json` + `sw.js`.
Hospedado no GitHub Pages.

```
index.html      app inteiro (interface + lógica + ícones embutidos)
manifest.json   metadados do PWA
sw.js           service worker (offline)

```
