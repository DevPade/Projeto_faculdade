// Este arquivo faz o site funcionar. Ele está dividido em blocos:
//   1. cultos e comunicados (vêm do dados.json)
//   2. menu, rolagem e animações
//   3. versículo do dia
//   4. formulário de contato
//   5. busca da Bíblia
//   6. início (liga tudo no final do arquivo)


// Roda uma função. Se ela der erro, avisa no console (tecla F12) qual foi,
// e o resto do site continua funcionando.
function executar(funcao) {
    try {
        funcao();
    } catch (erro) {
        console.error('Erro na função ' + funcao.name + ':', erro);
    }
}


// ============================================================
// 1. CULTOS E COMUNICADOS
// ============================================================

let dados = { cultos: [], comunicados: [] };
let mostrandoRascunho = false;  // true = o site está mostrando alterações do painel que ainda não foram publicadas
let mostrandoTodos = false;     // true = o botão "Ver Todos os Comunicados" está aberto

// Troca < > & " por códigos seguros. Assim um texto digitado no painel nunca quebra a página.
function limparTexto(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Lê o conteúdo do site. Se o painel guardou um rascunho neste navegador, usa o rascunho.
// Se não, lê o arquivo dados.json.
async function carregarDados() {
    const rascunho = localStorage.getItem('admin-dados');

    if (rascunho) {
        try {
            const dadosDoRascunho = JSON.parse(rascunho);
            mostrandoRascunho = true;
            return dadosDoRascunho;
        } catch (erro) {
            localStorage.removeItem('admin-dados');  // rascunho estragado: apaga e segue
        }
    }

    const resposta = await fetch('dados.json');
    return resposta.json();
}

// Desenha os cards de culto dentro de #grid-cultos.
function mostrarCultos() {
    const grid = document.getElementById('grid-cultos');
    if (grid === null) {
        return;  // a seção de cultos não existe no HTML: não tem onde desenhar
    }

    let html = '';

    for (const culto of dados.cultos) {
        html += `
            <div class="culto-card">
                <div class="culto-card-topo">
                    <span class="culto-horario">${limparTexto(culto.horario)}</span>
                </div>
                <h3 class="culto-titulo">${limparTexto(culto.titulo)}</h3>
                <p class="culto-descricao">${limparTexto(culto.descricao)}</p>
            </div>`;
    }

    if (html === '') {
        html = '<p class="carregando">Nenhum culto cadastrado.</p>';
    }

    grid.innerHTML = html;
}

// Desenha os cards de comunicado dentro de #grid-comunicados.
// Comunicados com destaque = false só aparecem depois de clicar em "Ver Todos".
function mostrarComunicados() {
    const grid = document.getElementById('grid-comunicados');
    const botao = document.getElementById('btn-mais-comunicados');
    if (grid === null) {
        return;  // a seção de comunicados não existe no HTML
    }

    let html = '';
    let escondidos = 0;

    for (const comunicado of dados.comunicados) {
        if (comunicado.destaque === false && mostrandoTodos === false) {
            escondidos++;
            continue;  // pula este e vai para o próximo
        }

        html += `
            <div class="evento-card">
                <div class="evento-card-topo">
                    <img src="${limparTexto(comunicado.imagem)}" alt="${limparTexto(comunicado.titulo)}" onerror="this.style.visibility='hidden'">
                </div>
                <div class="evento-card-conteudo">
                    <span class="evento-data">${limparTexto(comunicado.data)}</span>
                    <h5>${limparTexto(comunicado.titulo)}</h5>
                    <p>${limparTexto(comunicado.texto)}</p>
                </div>
            </div>`;
    }

    if (html === '') {
        html = '<p class="carregando">Nenhum comunicado publicado.</p>';
    }

    grid.innerHTML = html;

    if (botao === null) {
        return;  // sem o botão "Ver Todos", só os cards já bastam
    }

    // o botão só aparece se tem comunicado escondido (ou se está aberto, para poder fechar)
    if (escondidos > 0 || mostrandoTodos) {
        botao.style.display = '';
    } else {
        botao.style.display = 'none';
    }

    if (mostrandoTodos) {
        botao.textContent = 'Ver Menos';
    } else {
        botao.textContent = 'Ver Todos os Comunicados';
    }
}

// Clique em "Ver Todos os Comunicados" / "Ver Menos".
function alternarComunicados() {
    mostrandoTodos = !mostrandoTodos;  // true vira false, false vira true
    mostrarComunicados();
    animarCards();
}

// Mostra uma faixa amarela quando você está vendo alterações que o público ainda não vê.
function mostrarAvisoRascunho() {
    if (mostrandoRascunho === false) {
        return;
    }

    const aviso = document.createElement('div');
    aviso.className = 'aviso-rascunho';
    aviso.innerHTML = '<strong>Pré-visualização.</strong> Você está vendo alterações do painel que ainda não foram publicadas. Os visitantes não veem isto. <a href="admin.html">Abrir painel</a>';
    document.body.appendChild(aviso);
}

// Carrega os dados e desenha as duas seções. Se der erro, avisa na tela.
async function iniciarConteudo() {
    try {
        dados = await carregarDados();
    } catch (erro) {
        let mensagem = 'Não foi possível carregar o conteúdo. Recarregue a página.';

        // aberto com duplo clique no arquivo: o navegador bloqueia a leitura do dados.json
        if (window.location.protocol === 'file:') {
            mensagem = 'Abra o site pelo Live Server (ou outro servidor local). Com duplo clique no arquivo, o navegador bloqueia a leitura do dados.json. Veja o LEIA-ME.';
        }

        for (const aviso of document.querySelectorAll('.carregando')) {
            aviso.textContent = mensagem;
        }
        return;
    }

    // se o dados.json não tiver uma das listas, começa com ela vazia
    if (!dados.cultos) {
        dados.cultos = [];
    }
    if (!dados.comunicados) {
        dados.comunicados = [];
    }

    executar(mostrarCultos);
    executar(mostrarComunicados);
    executar(mostrarAvisoRascunho);
    executar(animarCards);
}


// ============================================================
// 2. MENU, ROLAGEM E ANIMAÇÕES
// ============================================================

// Abre o menu no celular (se estiver aberto, fecha).
function abrirOuFecharMenu() {
    const menu = document.querySelector('.nav-links');
    const botao = document.querySelector('.nav-toggle');
    if (menu === null || botao === null) {
        return;
    }

    const aberto = menu.classList.toggle('nav-links-aberto');  // liga/desliga a classe e devolve true/false
    botao.setAttribute('aria-expanded', aberto);
}

function fecharMenu() {
    const menu = document.querySelector('.nav-links');
    const botao = document.querySelector('.nav-toggle');
    if (menu === null || botao === null) {
        return;
    }

    menu.classList.remove('nav-links-aberto');
    botao.setAttribute('aria-expanded', false);
}

// Roda toda vez que a página rola. Faz 3 coisas:
//   - sombra no menu quando sai do topo
//   - mostra o botão "voltar ao topo"
//   - pinta de dourado o link da seção que está na tela
function aoRolar() {
    const rolagem = window.scrollY;
    const menu = document.querySelector('.nav-bar');
    const botaoTopo = document.querySelector('.voltar-topo');

    if (menu !== null) {
        menu.classList.toggle('nav-bar-rolada', rolagem > 10);
    }
    if (botaoTopo !== null) {
        botaoTopo.classList.toggle('voltar-topo-visivel', rolagem > 400);
    }

    let secaoAtual = '';
    for (const secao of document.querySelectorAll('section[id]')) {
        if (rolagem >= secao.offsetTop - 120) {
            secaoAtual = secao.id;  // a última seção que já passou do topo é a atual
        }
    }

    for (const link of document.querySelectorAll('.nav-links a')) {
        link.classList.toggle('ativo', link.getAttribute('href') === '#' + secaoAtual);
    }
}

function voltarAoTopo() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Faz os cards aparecerem suavemente quando entram na tela.
// A classe "animar" deixa o card invisível; a classe "aparecer" mostra (veja o CSS).
function animarCards() {
    const observador = new IntersectionObserver(function (itens) {
        for (const item of itens) {
            if (item.isIntersecting) {
                item.target.classList.add('aparecer');
            }
        }
    });

    const cards = document.querySelectorAll('.culto-card, .evento-card, .versiculo-card, .lideranca-card, .contato-form');
    for (const card of cards) {
        card.classList.add('animar');
        observador.observe(card);
    }
}


// ============================================================
// 3. VERSÍCULO DO DIA
// ============================================================

const versiculosDoDia = [
    { referencia: 'JOÃO 3:16', texto: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
    { referencia: 'SALMOS 23:1', texto: 'O Senhor é o meu pastor; nada me faltará.' },
    { referencia: 'FILIPENSES 4:13', texto: 'Posso todas as coisas naquele que me fortalece.' },
    { referencia: 'ISAÍAS 41:10', texto: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.' },
    { referencia: 'PROVÉRBIOS 3:5', texto: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.' },
    { referencia: 'JOSUÉ 1:9', texto: 'Sê forte e corajoso; não temas, nem te espantes, porque o Senhor teu Deus é contigo por onde quer que andares.' },
    { referencia: 'MATEUS 11:28', texto: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.' },
];

// Escolhe um versículo da lista de acordo com o dia do mês. Muda sozinho todo dia.
function mostrarVersiculoDoDia() {
    const posicao = new Date().getDate() % versiculosDoDia.length;  // % = resto da divisão
    const versiculo = versiculosDoDia[posicao];
    const texto = document.getElementById('versiculo-dia-texto');
    const referencia = document.getElementById('versiculo-dia-ref');

    if (texto === null || referencia === null) {
        return;  // a faixa do versículo do dia não existe no HTML
    }

    texto.textContent = '"' + versiculo.texto + '"';
    referencia.textContent = versiculo.referencia + ' — VERSÍCULO DO DIA';
}

function mostrarAnoRodape() {
    const ano = document.getElementById('ano-atual');
    if (ano !== null) {
        ano.textContent = new Date().getFullYear();
    }
}


// ============================================================
// 4. FORMULÁRIO DE CONTATO
// ============================================================

// Confere os campos e, se estiver tudo certo, envia a mensagem para o Formspree
// (que encaminha para o e-mail do pastor).
async function enviarContato(evento) {
    evento.preventDefault();  // impede a página de recarregar

    const formulario = document.getElementById('form-contato');
    const status = document.getElementById('contato-status');
    const botao = document.getElementById('btn-enviar-contato');

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();

    // texto vazio ('') = campo certo. Texto com aviso = campo errado.
    const erroNome = nome.length < 3 ? 'Digite seu nome completo.' : '';
    const erroEmail = /\S+@\S+\.\S+/.test(email) ? '' : 'Digite um e-mail válido.';  // formato algo@algo.algo
    const erroMensagem = mensagem.length < 10 ? 'Escreva pelo menos 10 caracteres.' : '';

    document.getElementById('erro-nome').textContent = erroNome;
    document.getElementById('erro-email').textContent = erroEmail;
    document.getElementById('erro-mensagem').textContent = erroMensagem;

    if (erroNome || erroEmail || erroMensagem) {
        return;  // tem campo errado: para aqui
    }

    if (formulario.action.includes('SEU_ID_AQUI')) {
        status.className = 'form-status form-status-erro';
        status.textContent = 'Falta configurar o Formspree no index.html (veja o LEIA-ME).';
        return;
    }

    status.className = 'form-status';
    status.textContent = 'Enviando...';
    botao.disabled = true;  // evita clicar duas vezes

    let enviou = false;
    try {
        const resposta = await fetch(formulario.action, {
            method: 'POST',
            body: new FormData(formulario),
            headers: { Accept: 'application/json' },
        });
        enviou = resposta.ok;
    } catch (erro) {
        enviou = false;  // sem internet, por exemplo
    }

    botao.disabled = false;

    if (enviou) {
        status.className = 'form-status form-status-ok';
        status.textContent = 'Mensagem enviada! Em breve entraremos em contato.';
        formulario.reset();
    } else {
        status.className = 'form-status form-status-erro';
        status.textContent = 'Não conseguimos enviar agora. Tente novamente.';
    }
}


// ============================================================
// 5. BUSCA DA BÍBLIA
// A pessoa digita "João 3:16". Nós trocamos o nome do livro pelo nome em inglês
// ("john 3:16") porque é assim que o site bible-api.com entende, e pedimos o texto
// em português (tradução Almeida). Essa API só busca por referência, não por palavra.
// ============================================================

// [nome em português, nome que a API entende]
const livros = [
    ['Gênesis', 'genesis'], ['Êxodo', 'exodus'], ['Levítico', 'leviticus'], ['Números', 'numbers'],
    ['Deuteronômio', 'deuteronomy'], ['Josué', 'joshua'], ['Juízes', 'judges'], ['Rute', 'ruth'],
    ['1 Samuel', '1 samuel'], ['2 Samuel', '2 samuel'], ['1 Reis', '1 kings'], ['2 Reis', '2 kings'],
    ['1 Crônicas', '1 chronicles'], ['2 Crônicas', '2 chronicles'], ['Esdras', 'ezra'], ['Neemias', 'nehemiah'],
    ['Ester', 'esther'], ['Jó', 'job'], ['Salmos', 'psalms'], ['Salmo', 'psalms'], ['Provérbios', 'proverbs'],
    ['Eclesiastes', 'ecclesiastes'], ['Cantares', 'song of solomon'], ['Cânticos', 'song of solomon'],
    ['Isaías', 'isaiah'], ['Jeremias', 'jeremiah'], ['Lamentações', 'lamentations'], ['Ezequiel', 'ezekiel'],
    ['Daniel', 'daniel'], ['Oséias', 'hosea'], ['Joel', 'joel'], ['Amós', 'amos'], ['Obadias', 'obadiah'],
    ['Jonas', 'jonah'], ['Miquéias', 'micah'], ['Naum', 'nahum'], ['Habacuque', 'habakkuk'],
    ['Sofonias', 'zephaniah'], ['Ageu', 'haggai'], ['Zacarias', 'zechariah'], ['Malaquias', 'malachi'],
    ['Mateus', 'matthew'], ['Marcos', 'mark'], ['Lucas', 'luke'], ['João', 'john'], ['Atos', 'acts'],
    ['Romanos', 'romans'], ['1 Coríntios', '1 corinthians'], ['2 Coríntios', '2 corinthians'],
    ['Gálatas', 'galatians'], ['Efésios', 'ephesians'], ['Filipenses', 'philippians'],
    ['Colossenses', 'colossians'], ['1 Tessalonicenses', '1 thessalonians'], ['2 Tessalonicenses', '2 thessalonians'],
    ['1 Timóteo', '1 timothy'], ['2 Timóteo', '2 timothy'], ['Tito', 'titus'], ['Filemom', 'philemon'],
    ['Hebreus', 'hebrews'], ['Tiago', 'james'], ['1 Pedro', '1 peter'], ['2 Pedro', '2 peter'],
    ['1 João', '1 john'], ['2 João', '2 john'], ['3 João', '3 john'], ['Judas', 'jude'], ['Apocalipse', 'revelation'],
];

// Palavras soltas que a pessoa pode digitar. Cada uma leva a um versículo escolhido por nós.
// [como mostrar, como a API entende]
const temas = {
    fe: ['Hebreus 11:1', 'hebrews 11:1'],
    amor: ['1 Coríntios 13:4-7', '1 corinthians 13:4-7'],
    esperanca: ['Romanos 15:13', 'romans 15:13'],
    paz: ['Filipenses 4:6-7', 'philippians 4:6-7'],
    forca: ['Isaías 41:10', 'isaiah 41:10'],
    perdao: ['Colossenses 3:13', 'colossians 3:13'],
    cura: ['Jeremias 17:14', 'jeremiah 17:14'],
};

// Tira os acentos: "João" vira "Joao". Assim "joao", "João" e "JOÃO" são a mesma coisa.
function tirarAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Transforma o que a pessoa digitou em duas versões: a que mostramos e a que a API entende.
// Devolve null se não entender o que foi digitado.
function montarReferencia(digitado) {
    const texto = tirarAcentos(digitado.toLowerCase()).trim().replace(/\s+/g, ' ');

    // 1) é uma palavra solta, como "fé" ou "paz"?
    if (temas.hasOwnProperty(texto)) {
        return { exibir: temas[texto][0], api: temas[texto][1] };
    }

    // 2) é "livro + números"? O último pedaço são os números ("3:16"), o resto é o livro.
    const partes = texto.split(' ');
    const numeros = partes.pop();          // pop() tira o último pedaço da lista e devolve ele
    const nomeDoLivro = partes.join(' ');

    if (isNaN(parseInt(numeros))) {
        return null;                       // o último pedaço não começa com número
    }

    for (const livro of livros) {
        if (tirarAcentos(livro[0].toLowerCase()) === nomeDoLivro) {
            return { exibir: livro[0] + ' ' + numeros, api: livro[1] + ' ' + numeros };
        }
    }

    return null;  // não achou o livro
}

// Busca o versículo na API e coloca no card.
async function buscarVersiculo(evento) {
    evento.preventDefault();

    const aviso = document.getElementById('busca-aviso');
    const referencia = montarReferencia(document.getElementById('busca-biblia').value);

    if (referencia === null) {
        aviso.textContent = 'Não entendi. Tente "Salmos 23", "João 3:16" ou uma palavra como fé, amor ou paz.';
        return;
    }

    aviso.textContent = 'Buscando...';

    try {
        const endereco = 'https://bible-api.com/' + encodeURIComponent(referencia.api) + '?translation=almeida';
        const resposta = await fetch(endereco);
        const resultado = await resposta.json();

        if (resultado.error) {
            aviso.textContent = 'Não encontramos esse versículo. Confira o capítulo e o número.';
            return;
        }

        document.querySelector('.versiculo-referencia').textContent = referencia.exibir;
        document.querySelector('.versiculo-texto').textContent = '"' + resultado.text.trim().replace(/\s+/g, ' ') + '"';
        aviso.textContent = '';
        marcarSalvo();
    } catch (erro) {
        aviso.textContent = 'Não foi possível buscar agora. Verifique sua internet e tente de novo.';
    }
}

// Lê a lista de versículos salvos (fica guardada no navegador da pessoa).
function lerSalvos() {
    return JSON.parse(localStorage.getItem('versiculos-salvos')) || [];
}

// Pinta o marcador de dourado se o versículo que está no card já foi salvo.
function marcarSalvo() {
    const referencia = document.querySelector('.versiculo-referencia');
    const marcador = document.querySelector('.versiculo-salvar');
    if (referencia === null || marcador === null) {
        return;  // o card do versículo não existe no HTML
    }

    marcador.classList.toggle('versiculo-salvo', lerSalvos().includes(referencia.textContent));
}

// Clique no marcador: salva o versículo, ou tira se já estava salvo.
function salvarVersiculo() {
    const referencia = document.querySelector('.versiculo-referencia').textContent;
    let salvos = lerSalvos();

    if (salvos.includes(referencia)) {
        salvos = salvos.filter(function (item) { return item !== referencia; });  // tira da lista
    } else {
        salvos.push(referencia);                                                   // põe na lista
    }

    localStorage.setItem('versiculos-salvos', JSON.stringify(salvos));
    marcarSalvo();
}

// Clique em "Compartilhar": no celular abre o menu de compartilhar; no computador copia o texto.
async function compartilharVersiculo() {
    const botao = document.querySelector('.versiculo-compartilhar');
    const referencia = document.querySelector('.versiculo-referencia').textContent;
    const texto = document.querySelector('.versiculo-texto').textContent.trim();
    const mensagem = referencia + '\n' + texto;

    try {
        if (navigator.share) {
            await navigator.share({ text: mensagem });
        } else {
            await navigator.clipboard.writeText(mensagem);
            const conteudoOriginal = botao.innerHTML;
            botao.textContent = 'Copiado!';
            setTimeout(function () { botao.innerHTML = conteudoOriginal; }, 2000);
        }
    } catch (erro) {
        // a pessoa cancelou, ou o navegador não deixou. Não precisa fazer nada.
    }
}


// ============================================================
// 6. INÍCIO: liga cada botão à sua função e desenha a página
// ============================================================

// Liga uma função a um evento de um elemento (se o elemento existir na página).
// Exemplo: ligar('.voltar-topo', 'click', voltarAoTopo)  =  "quando clicar em .voltar-topo, rode voltarAoTopo"
function ligar(seletor, tipoDeEvento, funcao) {
    const elemento = document.querySelector(seletor);
    if (elemento) {
        elemento.addEventListener(tipoDeEvento, funcao);
    }
}

ligar('.nav-toggle', 'click', abrirOuFecharMenu);
ligar('.voltar-topo', 'click', voltarAoTopo);
ligar('#btn-mais-comunicados', 'click', alternarComunicados);
ligar('#form-contato', 'submit', enviarContato);
ligar('#form-busca', 'submit', buscarVersiculo);
ligar('.versiculo-salvar', 'click', salvarVersiculo);
ligar('.versiculo-compartilhar', 'click', compartilharVersiculo);
window.addEventListener('scroll', aoRolar);

for (const link of document.querySelectorAll('.nav-links a')) {
    link.addEventListener('click', fecharMenu);  // clicou num link: fecha o menu do celular
}

executar(mostrarVersiculoDoDia);
executar(mostrarAnoRodape);
executar(marcarSalvo);
executar(aoRolar);
executar(animarCards);   // cards que já estão no HTML (liderança, versículo, formulário)
iniciarConteudo();       // cultos e comunicados (vêm do dados.json)