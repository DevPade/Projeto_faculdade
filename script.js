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

    const cards = document.querySelectorAll('.culto-card, .evento-card, .versiculo-card, .contato-form');
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
// (que encaminha para o e-mail da igreja).
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
// A pessoa digita "João 3:16". Nós descobrimos o código do livro ("JHN") e pedimos o
// capítulo inteiro ao site bible-api.com (tradução Almeida, em português). Depois
// ficamos só com os versículos pedidos. Essa API só busca por referência, não por palavra.
// ============================================================

// [nome em português, código do livro na API]
const livros = [
    ['Gênesis', 'GEN'], ['Êxodo', 'EXO'], ['Levítico', 'LEV'], ['Números', 'NUM'],
    ['Deuteronômio', 'DEU'], ['Josué', 'JOS'], ['Juízes', 'JDG'], ['Rute', 'RUT'],
    ['1 Samuel', '1SA'], ['2 Samuel', '2SA'], ['1 Reis', '1KI'], ['2 Reis', '2KI'],
    ['1 Crônicas', '1CH'], ['2 Crônicas', '2CH'], ['Esdras', 'EZR'], ['Neemias', 'NEH'],
    ['Ester', 'EST'], ['Jó', 'JOB'], ['Salmos', 'PSA'], ['Salmo', 'PSA'], ['Provérbios', 'PRO'],
    ['Eclesiastes', 'ECC'], ['Cânticos', 'SNG'], ['Cantares', 'SNG'], ['Isaías', 'ISA'],
    ['Jeremias', 'JER'], ['Lamentações', 'LAM'], ['Ezequiel', 'EZK'], ['Daniel', 'DAN'],
    ['Oséias', 'HOS'], ['Joel', 'JOL'], ['Amós', 'AMO'], ['Obadias', 'OBA'], ['Jonas', 'JON'],
    ['Miquéias', 'MIC'], ['Naum', 'NAM'], ['Habacuque', 'HAB'], ['Sofonias', 'ZEP'],
    ['Ageu', 'HAG'], ['Zacarias', 'ZEC'], ['Malaquias', 'MAL'], ['Mateus', 'MAT'],
    ['Marcos', 'MRK'], ['Lucas', 'LUK'], ['João', 'JHN'], ['Atos', 'ACT'], ['Romanos', 'ROM'],
    ['1 Coríntios', '1CO'], ['2 Coríntios', '2CO'], ['Gálatas', 'GAL'], ['Efésios', 'EPH'],
    ['Filipenses', 'PHP'], ['Colossenses', 'COL'], ['1 Tessalonicenses', '1TH'],
    ['2 Tessalonicenses', '2TH'], ['1 Timóteo', '1TI'], ['2 Timóteo', '2TI'], ['Tito', 'TIT'],
    ['Filemom', 'PHM'], ['Hebreus', 'HEB'], ['Tiago', 'JAS'], ['1 Pedro', '1PE'], ['2 Pedro', '2PE'],
    ['1 João', '1JN'], ['2 João', '2JN'], ['3 João', '3JN'], ['Judas', 'JUD'], ['Apocalipse', 'REV'],
];

// Palavras soltas que a pessoa pode digitar. Cada uma leva a um versículo escolhido por nós.
const temas = {
    fe: 'Hebreus 11:1',
    amor: '1 Coríntios 13:4-7',
    esperanca: 'Romanos 15:13',
    paz: 'Filipenses 4:6-7',
    forca: 'Isaías 41:10',
    perdao: 'Colossenses 3:13',
    cura: 'Jeremias 17:14',
};

// Quantos versículos mostrar quando a pessoa pede um capítulo inteiro.
const maximoDeVersiculos = 8;

// Tira os acentos: "João" vira "Joao". Assim "joao", "João" e "JOÃO" são a mesma coisa.
function tirarAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Entende o que a pessoa digitou ("João 3:16") e separa em pedaços:
//   { nome: 'João', codigo: 'JHN', capitulo: 3, primeiro: 16, ultimo: 16 }
// "primeiro" e "ultimo" valem 0 quando a pessoa pediu o capítulo inteiro.
// Devolve null se não entender.
function montarReferencia(digitado) {
    let texto = tirarAcentos(digitado.toLowerCase()).trim().replace(/\s+/g, ' ');

    // palavra solta ("fé", "paz"...)? troca pelo versículo escolhido para ela
    if (temas.hasOwnProperty(texto)) {
        texto = tirarAcentos(temas[texto].toLowerCase());
    }

    // o último pedaço são os números ("91:1-2"); o resto é o nome do livro
    const partes = texto.split(' ');
    const numeros = partes.pop();          // pop() tira o último pedaço da lista e devolve ele
    const nomeDoLivro = partes.join(' ');

    // "91:1-2" vira capítulo "91" e versículos "1-2"
    const capituloEVersiculos = numeros.split(':');
    const capitulo = parseInt(capituloEVersiculos[0]);
    let primeiro = 0;
    let ultimo = 0;

    if (isNaN(capitulo) || capitulo < 1) {
        return null;
    }

    if (capituloEVersiculos.length > 1) {
        const intervalo = capituloEVersiculos[1].split('-');   // "1-2" vira ["1", "2"]
        primeiro = parseInt(intervalo[0]);
        ultimo = intervalo.length > 1 ? parseInt(intervalo[1]) : primeiro;

        if (isNaN(primeiro) || isNaN(ultimo)) {
            return null;
        }
    }

    for (const livro of livros) {
        if (tirarAcentos(livro[0].toLowerCase()) === nomeDoLivro) {
            return { nome: livro[0], codigo: livro[1], capitulo: capitulo, primeiro: primeiro, ultimo: ultimo };
        }
    }

    return null;  // não achou o livro
}

// Acha o parágrafo de avisos embaixo da busca. Se não existir no HTML, cria.
function pegarAvisoDaBusca(formulario) {
    let aviso = document.getElementById('busca-aviso');

    if (aviso === null) {
        aviso = document.createElement('p');
        aviso.id = 'busca-aviso';
        aviso.className = 'biblia-aviso';
        formulario.insertAdjacentElement('afterend', aviso);
    }

    return aviso;
}

// Clique em "Buscar": pede o capítulo à API e coloca o resultado no card.
async function buscarVersiculo(evento) {
    evento.preventDefault();  // impede a página de recarregar

    const formulario = evento.currentTarget;  // o formulário que foi enviado
    const campo = formulario.querySelector('input');
    const aviso = pegarAvisoDaBusca(formulario);
    const referencia = montarReferencia(campo.value);

    if (referencia === null) {
        aviso.textContent = 'Não entendi. Tente "Salmos 23", "João 3:16" ou uma palavra como fé, amor ou paz.';
        return;
    }

    aviso.textContent = 'Buscando...';

    try {
        const endereco = 'https://bible-api.com/data/almeida/' + referencia.codigo + '/' + referencia.capitulo;
        const resposta = await fetch(endereco);

        if (resposta.status === 429) {
            aviso.textContent = 'Muitas buscas seguidas. Espere alguns segundos e tente de novo.';
            return;
        }
        if (!resposta.ok) {
            aviso.textContent = 'Não encontramos esse capítulo. Confira o número.';
            return;
        }

        const resultado = await resposta.json();
        let versiculos = resultado.verses || [];

        // pediu versículos específicos ("3:16" ou "1-2")? fica só com eles
        if (referencia.primeiro > 0) {
            versiculos = versiculos.filter(function (versiculo) {
                return versiculo.verse >= referencia.primeiro && versiculo.verse <= referencia.ultimo;
            });
        }

        if (versiculos.length === 0) {
            aviso.textContent = 'Não encontramos esse versículo. Confira o número.';
            return;
        }

        // capítulo inteiro e muito grande: mostra só o começo
        let cortado = false;
        if (referencia.primeiro === 0 && versiculos.length > maximoDeVersiculos) {
            versiculos = versiculos.slice(0, maximoDeVersiculos);  // pega só os primeiros
            cortado = true;
        }

        // junta o texto de todos os versículos numa frase só
        let texto = '';
        for (const versiculo of versiculos) {
            texto += versiculo.text.trim().replace(/\s+/g, ' ') + ' ';
        }

        // título do card: "Salmos 91:1-2" (ou só "Salmos 23" quando mostrou o capítulo todo)
        let titulo = referencia.nome + ' ' + referencia.capitulo;
        const primeiroMostrado = versiculos[0].verse;
        const ultimoMostrado = versiculos[versiculos.length - 1].verse;

        if (referencia.primeiro > 0 || cortado) {
            titulo += ':' + primeiroMostrado;
            if (ultimoMostrado > primeiroMostrado) {
                titulo += '-' + ultimoMostrado;
            }
        }

        document.querySelector('.versiculo-referencia').textContent = titulo;
        document.querySelector('.versiculo-texto').textContent = '"' + texto.trim() + '"';

        if (cortado) {
            aviso.textContent = 'Capítulo grande: mostrando só os ' + maximoDeVersiculos + ' primeiros versículos. Para um trecho, digite por exemplo ' + referencia.nome + ' ' + referencia.capitulo + ':10-12.';
        } else {
            aviso.textContent = '';
        }
    } catch (erro) {
        aviso.textContent = 'Não foi possível buscar agora. Verifique sua internet e tente de novo.';
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
ligar('.biblia-busca', 'submit', buscarVersiculo);
window.addEventListener('scroll', aoRolar);

for (const link of document.querySelectorAll('.nav-links a')) {
    link.addEventListener('click', fecharMenu);  // clicou num link: fecha o menu do celular
}

executar(mostrarVersiculoDoDia);
executar(mostrarAnoRodape);
executar(aoRolar);
executar(animarCards);   // cards que já estão no HTML (versículo, formulário)
iniciarConteudo();       // cultos e comunicados (vêm do dados.json)