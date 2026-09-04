# 🧁 Surpresinha Doce — Controle de Custos e Lucro

App para a confeitaria **Surpresinha Doce** controlar o preço dos ingredientes,
calcular o custo de cada bolo e saber quanto está lucrando.

👉 **Abrir o app:** https://flynmael.github.io/surpresinha-doce/

## O que dá para fazer

- **Ingredientes** — cadastrar farinha, açúcar, leite… com o preço e a quantidade
  da embalagem (ex.: 5 kg por R$ 25,90). O app calcula sozinho o custo por grama, ml ou unidade.
- **Receitas** — montar cada bolo escolhendo os ingredientes e as quantidades usadas,
  somar outros custos (gás, embalagem, mão de obra) e ver o custo total.
- **Lucro** — informar o preço de venda e ver lucro em R$, margem em % e o multiplicador do custo.
- **Preço sugerido** — informar a margem desejada (ou o multiplicador) e o app diz por quanto vender.
- **Resumo** — comparar o lucro de todas as receitas e ver a margem média.
- **Backup** — baixar e restaurar um arquivo com todos os dados.

## Como usar no celular

1. Abrir o link acima no navegador do celular.
2. Menu do navegador → **"Adicionar à tela inicial"** / **"Instalar app"**.
3. Pronto: vira um ícone e funciona offline.

## Onde ficam os dados

Tudo é salvo **no próprio aparelho** (localStorage do navegador). Nada vai para a internet,
e os dados continuam lá depois de fechar o app ou desligar o celular.

Os dados só somem se: limpar os dados do site nas configurações do navegador, usar aba anônima,
ou trocar de aparelho/navegador. Por isso o botão **Baixar backup** na aba Resumo.

## Técnico

HTML/CSS/JS puro, sem dependências e sem build. A logo e os ícones vão embutidos como `data:` URI,
então o repositório é só texto. PWA com `manifest.json` + `sw.js` (cache network-first).

```
index.html      app inteiro: interface, lógica, logo e ícones
manifest.json   metadados do PWA
sw.js           service worker (offline)
```

Identidade visual tirada da logo da marca: aquarela aqua, teal `#2E7C86` e dourado `#C29455`.

> Ao publicar uma alteração, subir o número da versão em `sw.js`
> (`const CACHE = 'surpresinha-vN'`) para os celulares pegarem a versão nova.
