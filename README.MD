# Site da AD Novo Tempo

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site que os visitantes veem |
| `styleSis.css` | Visual do site (cores, tamanhos, espaços) |
| `responsive.css` | Ajustes para tablet e celular |
| `script.js` | Faz o site funcionar (menu, comunicados, busca da Bíblia, contato) |
| `dados.json` | **O conteúdo:** cultos e comunicados. É o que o painel edita |
| `admin.html` / `admin.css` / `admin.js` | Painel do pastor |
| `imagens/` | Crie esta pasta e coloque as fotos aqui |

Use sempre nomes em **minúsculas**. Windows e Mac não diferenciam `Admin.js` de `admin.js`, mas a hospedagem diferencia. O site funciona no seu computador e quebra no ar.

## Rodar no seu computador

Não abra o `index.html` com duplo clique: o navegador bloqueia a leitura do `dados.json`. Use um servidor local:

- **VS Code:** extensão *Live Server* → botão direito no `index.html` → *Open with Live Server*
- **Terminal:** `python3 -m http.server 8000` e abra `http://localhost:8000`

## Painel do pastor (`admin.html`)

1. Crie, edite ou exclua cultos e comunicados.
2. Clique em **Baixar dados.json**.
3. Troque o `dados.json` do servidor por esse arquivo.

Enquanto você edita, as mudanças ficam só no seu navegador, e o site mostra uma **faixa amarela de pré-visualização**. Os visitantes só veem depois do passo 3. Se a faixa não aparece, você está vendo exatamente o que o público vê.

O painel não tem senha. Proteja a pasta pelo painel da hospedagem ("proteção de diretório") ou não divulgue o endereço.

Imagens: o painel pede o **caminho** (`imagens/foto.jpg`); você sobe a foto na pasta `imagens/` pela hospedagem. Se a imagem não existir, o card mostra um fundo cinza no lugar.

## Mensagens para o e-mail do pastor (Formspree)

1. Crie uma conta em [formspree.io](https://formspree.io) **com o e-mail do pastor**.
2. *New Form* → copie o endereço, algo como `https://formspree.io/f/abcdwxyz`.
3. No `index.html`, procure `SEU_ID_AQUI` e troque pelo código (`abcdwxyz`).
4. Mande uma mensagem de teste pelo site e confirme o e-mail que o Formspree enviar.

Enquanto o `SEU_ID_AQUI` não for trocado, o formulário avisa "Falta configurar o Formspree".

## Mapa do `script.js`

| Bloco | Funções | O que fazem |
|---|---|---|
| Cultos e comunicados | `carregarDados`, `mostrarCultos`, `mostrarComunicados`, `alternarComunicados`, `mostrarAvisoRascunho`, `iniciarConteudo` | Leem o `dados.json` e desenham os cards |
| Menu e rolagem | `abrirOuFecharMenu`, `fecharMenu`, `aoRolar`, `voltarAoTopo`, `animarCards` | Menu do celular, sombra do menu, link dourado da seção atual, botão de topo, cards que aparecem |
| Versículo do dia | `mostrarVersiculoDoDia`, `mostrarAnoRodape` | Troca o versículo todo dia; ano do rodapé |
| Contato | `enviarContato` | Confere os campos e envia para o Formspree |
| Bíblia | `montarReferencia`, `buscarVersiculo`, `salvarVersiculo`, `marcarSalvo`, `compartilharVersiculo` | Busca "João 3:16", salva e compartilha |
| Início | `ligar` + as linhas finais | Liga cada botão à sua função |

Para saber o que um botão faz, procure o nome dele (ex. `.voltar-topo`) nas linhas finais do `script.js`: ali está escrito qual função roda.

## Mapa do `admin.js`

Cada ação tem uma função, e os botões do `admin.html` chamam elas direto (`onclick="excluirCulto(0)"`). Cada item é identificado pela **posição** na lista (0 = primeiro).

`carregarDados` · `guardarRascunho` · `trocarAba` · `baixarDados` · `descartarAlteracoes` · e, para cultos e comunicados: `mostrar...`, `salvar...`, `editar...`, `excluir...`, `limparFormulario...`

## Se alguma parte do site não aparecer

1. Abra o site e aperte **F12** → aba **Console**.
2. Se aparecer `Erro na função mostrarCultos: ...`, o nome depois de "função" é onde está o problema.
3. Aperte **Ctrl + F5** (recarrega ignorando o cache; o navegador guarda o `script.js` antigo).

Você pode **apagar seções do HTML** (cultos, versículo do dia, bíblia, rodapé...) que o resto do site continua funcionando: cada função confere se o lugar dela existe antes de desenhar. O mesmo vale para as abas do `admin.html`. Quando uma parte der erro de verdade, as outras seguem funcionando e o console diz qual foi.

## Busca da Bíblia

Usa o site gratuito bible-api.com, tradução Almeida. Ele só busca por **referência** (`Salmos 23`, `João 3:16`), não por palavra solta. As palavras `fé`, `amor`, `esperança`, `paz`, `força`, `perdão` e `cura` levam a um versículo escolhido na lista `temas`.