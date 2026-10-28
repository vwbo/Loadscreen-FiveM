# Loadscreen FiveM - LUNEXA ROLEPLAY

Tela de carregamento para servidor FiveM em branco e vermelho, com vídeo de fundo, player de música, banner da loja VIP, atalhos do servidor em um teclado interativo e barra de progresso real do carregamento.

## Recursos

- Vídeo de fundo com fallback: a tela nunca fica preta enquanto o vídeo carrega ou se ele falhar
- Barra de progresso e porcentagem ligadas aos eventos reais do FiveM
- Player de música com próxima, anterior, volume e silenciar
- A música começa sozinha, sem precisar clicar em nada
- Loja VIP com slides automáticos e botão que abre o link da loja
- Teclado de atalhos gerado por código, com tooltip em cada tecla destacada
- Redes sociais clicáveis
- Tudo configurável pelo `config.json`, sem mexer no código

## Estrutura de pastas

```
loadscreen/
├── fxmanifest.lua
├── index.html
├── style.css
├── script.js
├── config.json
└── assets/
    ├── images/
    │   ├── fare.png              (cursor do mouse)
    │   ├── vip.png               (banner padrão da loja)
    │   ├── store.svg             (ícone do botão da loja)
    │   ├── mouse-keyboard.svg    (ícone da dica do teclado)
    │   ├── test.png              (capa padrão do player)
    │   ├── banner_cd.png         (capas das músicas)
    │   ├── youtube.svg
    │   ├── instagram.svg
    │   ├── tiktok.svg
    │   └── discord.svg
    ├── video/
    │   ├── loading.webm          (vídeo de fundo)
    │   ├── loading.mp4           (opcional, usado se o .webm falhar)
    │   └── backgroud.png         (imagem de fundo enquanto o vídeo carrega)
    └── sounds/
        └── suas_musicas.mp3
```

> O nome `backgroud.png` está escrito assim de propósito, porque é o nome que o código usa. Se quiseres corrigir para `background.png`, troca também no `index.html` e no `style.css`.

## Instalação

1. Coloca a pasta `loadscreen` dentro de `resources/` do teu servidor.
2. Cria o `fxmanifest.lua` com este conteúdo:

```lua
fx_version 'cerulean'
game 'gta5'

author 'Seu Nome'
description 'Loadscreen'

loadscreen 'index.html'
loadscreen_cursor 'yes'

files {
    'index.html',
    'style.css',
    'script.js',
    'config.json',
    'assets/**/*'
}
```

3. Adiciona no `server.cfg`:

```
ensure loadscreen
```

4. Reinicia o servidor e entra para testar.

> `loadscreen_cursor 'yes'` é obrigatório. Sem ele o mouse não aparece e não dá para clicar na loja, nas redes sociais, no player nem passar o mouse nas teclas.

## Configuração (config.json)

Todo o conteúdo editável fica no `config.json`. Exemplo completo:

```json
{
  "store_url": "https://loja.seuservidor.com",

  "store": [
    {
      "image": "./assets/images/vip.png",
      "price": 109.90,
      "discount": 157.90
    },
    {
      "image": "./assets/images/vip2.png",
      "price": 59.90
    }
  ],

  "socials": [
    { "image": "./assets/images/youtube.svg", "url": "https://youtube.com/@seucanal" },
    { "image": "./assets/images/instagram.svg", "url": "https://instagram.com/seuperfil" },
    { "image": "./assets/images/tiktok.svg", "url": "https://tiktok.com/@seuperfil" },
    { "image": "./assets/images/discord.svg", "url": "https://discord.gg/seuconvite" }
  ],

  "playlist": [
    {
      "song": "Nome da música",
      "artist": "Nome do artista",
      "image": "./assets/images/banner_cd.png",
      "mp3": "./assets/sounds/musica1.mp3",
      "volume": 0.1
    }
  ],

  "keyboard": {
    "F1": "Abrir o menu do servidor",
    "F2": "Inventário",
    "E": "Interagir",
    "Z": "Algemar / soltar",
    "SHIFT": "Correr",
    "SPACE": "Pular"
  }
}
```

### Campos

| Campo | Descrição |
| --- | --- |
| `store_url` | Link aberto ao clicar em "IR PARA A LOJA". |
| `store[].image` | Banner do slide. |
| `store[].price` | Preço atual, mostrado como "POR APENAS R$...". |
| `store[].discount` | Preço antigo, mostrado riscado como "DE R$...". É opcional: se não colocares, a linha não aparece. |
| `socials[].image` | Ícone da rede social. |
| `socials[].url` | Link aberto ao clicar no ícone. |
| `playlist[].song` | Nome da música. |
| `playlist[].artist` | Artista. Nomes longos são cortados com "..." para não quebrar o layout. |
| `playlist[].image` | Capa da música. |
| `playlist[].mp3` | Caminho do arquivo de áudio. |
| `playlist[].volume` | Volume inicial, de `0` a `1`. Recomendado entre `0.05` e `0.15`. |
| `keyboard` | Atalhos do servidor: a chave é a tecla e o valor é o texto do tooltip. |

Se o `config.json` não carregar, a loadscreen usa uma playlist de reserva que está no topo do `script.js` e continua funcionando.

### Nomes de teclas aceitos em `keyboard`

Os nomes não diferenciam maiúsculas de minúsculas.

- Letras e números: `A` a `Z`, `0` a `9`
- Função: `F1` a `F12`
- Especiais: `ESC`, `TAB`, `CAPS`, `ENTER`, `BACKSPACE`, `SPACE`, `SHIFT`, `CTRL`, `ALT`
- Setas: `UP`, `DOWN`, `LEFT`, `RIGHT`
- Símbolos: `` ` ``, `-`, `=`, `[`, `]`, `\`, `;`, `'`, `,`, `.`, `/`

Qualquer nome que não esteja no teclado (por exemplo `MOUSE1`) aparece em uma lista de atalhos abaixo do teclado.

## Controles do jogador

| Tecla | Ação |
| --- | --- |
| `Espaço` | Pausar ou tocar a música |
| `H` | Mostrar ou ocultar o teclado de atalhos |

O teclado começa fechado. O botão no canto superior direito também abre e fecha.

## Personalização

### Cores

As cores ficam no topo do `style.css`:

```css
:root {
    --accent: #e5192d;      /* vermelho principal */
    --accent-hi: #ff3a4d;   /* vermelho ao passar o mouse */
}
```

Troca esses dois valores para mudar a cor de todo o visual.

### Vídeo de fundo

- Formato recomendado: `.webm` (VP9), 1920x1080, sem áudio
- Deixa o arquivo leve, de preferência abaixo de 20 MB, para carregar rápido
- O vídeo entra com fade assim que começa a tocar. Até lá aparece a imagem `backgroud.png` com um gradiente vermelho

### Música

- Usa `.mp3` e evita nomes com espaços ou acentos nos arquivos
- Podes ter quantas músicas quiseres na `playlist`. Ao terminar uma, a próxima toca sozinha, e depois da última volta para a primeira

## Solução de problemas

**Tela preta**
Confirma que `assets/video/loading.webm` existe e que o `assets/**/*` está no `files` do `fxmanifest.lua`. Se o vídeo não carregar, deve aparecer a imagem de fundo. Se nem isso aparecer, falta o `backgroud.png`.

**Não consigo clicar em nada**
Falta `loadscreen_cursor 'yes'` no `fxmanifest.lua`.

**A música não toca**
Verifica o caminho em `playlist[].mp3` e se o arquivo está em `assets/sounds/`. No FiveM ela toca sozinha. Ao testar o `index.html` no navegador, o Chrome bloqueia som sem interação, então a música começa no primeiro clique ou tecla.

**As teclas não ficam vermelhas**
O `config.json` não carregou. Ao abrir o `index.html` direto no navegador isso é normal, porque o navegador bloqueia a leitura de arquivos locais. Dentro do FiveM funciona. Para testar no PC, abre com um servidor local, por exemplo `npx serve` dentro da pasta.

**Erro no config.json**
Um erro de vírgula faz o arquivo inteiro falhar. Valida o conteúdo em um validador de JSON antes de salvar. O último item de cada lista não leva vírgula no final.

**A barra de progresso fica parada**
Dentro do FiveM ela segue o carregamento real. No navegador ela é só uma simulação para teste.

## Testar fora do jogo

Dentro da pasta da loadscreen:

```bash
npx serve .
```

Abre o endereço mostrado no navegador. Nesse modo a barra de progresso é simulada e a música começa no primeiro clique.
