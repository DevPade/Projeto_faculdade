// Painel do administrador. Aqui o pastor cria, edita e apaga cultos e comunicados.
// O que ele faz fica guardado no navegador (rascunho). Para os visitantes verem,
// é preciso baixar o dados.json e trocar o arquivo no servidor.
//
// Cada culto e comunicado é identificado pela POSIÇÃO na lista (0 = primeiro, 1 = segundo...).

let dados = { cultos: [], comunicados: [] };
let cultoEditando = null;       // posição do culto que está sendo editado (null = criando um novo)
let comunicadoEditando = null;  // o mesmo, para comunicados


// ============================================================
// GUARDAR E CARREGAR
// ============================================================

// Troca < > & " por códigos seguros, para o texto nunca quebrar a página.
function limparTexto(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Mensagem rápida no canto da tela.
function avisar(mensagem) {
    const aviso = document.getElementById('aviso-canto');
    if (aviso === null) {
        return;
    }

    aviso.textContent = mensagem;
    aviso.classList.add('aviso-canto-visivel');
    setTimeout(function () { aviso.classList.remove('aviso-canto-visivel'); }, 3000);
}

// Lê os dados: primeiro o rascunho guardado neste navegador; se não tiver, o dados.json.
async function carregarDados() {
    const rascunho = localStorage.getItem('admin-dados');
    let leu = false;

    if (rascunho) {
        try {
            dados = JSON.parse(rascunho);
            leu = true;
        } catch (erro) {
            localStorage.removeItem('admin-dados');  // rascunho estragado: apaga e segue
        }
    }

    if (leu === false) {
        try {
            const resposta = await fetch('dados.json');
            dados = await resposta.json();
        } catch (erro) {
            avisar('Não consegui ler o dados.json. Abra o painel por um servidor local (veja o LEIA-ME).');
        }
    }

    // se o arquivo não tiver uma das listas, começa com ela vazia
    if (!dados.cultos) {
        dados.cultos = [];
    }
    if (!dados.comunicados) {
        dados.comunicados = [];
    }
}

// Guarda o que está em "dados" no navegador. Chamamos depois de qualquer mudança.
function guardarRascunho() {
    localStorage.setItem('admin-dados', JSON.stringify(dados));
}


// ============================================================
// ABAS E BOTÕES DO TOPO
// ============================================================

function trocarAba(nome) {
    for (const aba of document.querySelectorAll('.aba')) {
        aba.classList.toggle('aba-ativa', aba.dataset.aba === nome);
    }
    for (const painel of document.querySelectorAll('.painel')) {
        painel.classList.toggle('painel-ativo', painel.id === 'painel-' + nome);
    }
}

// Cria o arquivo dados.json com tudo o que está no painel e baixa.
function baixarDados() {
    const texto = JSON.stringify(dados, null, 2);
    const arquivo = new Blob([texto], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(arquivo);
    link.download = 'dados.json';
    document.body.appendChild(link);
    link.click();
    link.remove();

    avisar('Arquivo baixado. Troque o dados.json do servidor por ele.');
}

// Apaga o rascunho e volta a ler o dados.json do servidor.
async function descartarAlteracoes() {
    if (!confirm('Descartar as alterações não publicadas e voltar ao dados.json do servidor?')) {
        return;
    }

    localStorage.removeItem('admin-dados');
    await carregarDados();
    mostrarCultos();
    mostrarComunicados();
    limparFormularioCulto();
    limparFormularioComunicado();
    avisar('Alterações descartadas.');
}


// ============================================================
// CULTOS
// ============================================================

// Desenha a lista de cultos na tela.
function mostrarCultos() {
    const lista = document.getElementById('lista-cultos');
    if (lista === null) {
        return;  // a aba de cultos não existe neste painel
    }

    let html = '';

    for (let i = 0; i < dados.cultos.length; i++) {
        const culto = dados.cultos[i];
        html += `
            <div class="item">
                <div class="item-info">
                    <span class="item-meta">${limparTexto(culto.horario)}</span>
                    <h4>${limparTexto(culto.titulo)}</h4>
                    <p>${limparTexto(culto.descricao)}</p>
                </div>
                <div class="item-botoes">
                    <button class="btn btn-linha btn-pequeno" onclick="editarCulto(${i})">Editar</button>
                    <button class="btn btn-perigo btn-pequeno" onclick="excluirCulto(${i})">Excluir</button>
                </div>
            </div>`;
    }

    if (html === '') {
        html = '<div class="vazio">Nenhum culto cadastrado ainda.</div>';
    }

    lista.innerHTML = html;
}

// Botão "Salvar culto": cria um novo ou atualiza o que está sendo editado.
function salvarCulto(evento) {
    evento.preventDefault();  // impede a página de recarregar

    const culto = {
        horario: document.getElementById('culto-horario').value,
        titulo: document.getElementById('culto-titulo').value,
        descricao: document.getElementById('culto-descricao').value,
    };

    if (cultoEditando === null) {
        dados.cultos.push(culto);               // novo culto vai para o fim da lista
        avisar('Culto criado. Lembre de baixar o dados.json para publicar.');
    } else {
        dados.cultos[cultoEditando] = culto;    // troca o culto antigo pelo novo
        avisar('Culto atualizado.');
    }

    guardarRascunho();
    mostrarCultos();
    limparFormularioCulto();
}

// Botão "Editar": põe os dados do culto no formulário.
function editarCulto(posicao) {
    const culto = dados.cultos[posicao];

    document.getElementById('culto-horario').value = culto.horario;
    document.getElementById('culto-titulo').value = culto.titulo;
    document.getElementById('culto-descricao').value = culto.descricao;

    cultoEditando = posicao;
    document.getElementById('titulo-form-culto').textContent = 'Editando culto';
    document.getElementById('cancelar-culto').hidden = false;
    document.getElementById('form-culto').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Botão "Excluir": tira o culto da lista.
function excluirCulto(posicao) {
    const culto = dados.cultos[posicao];

    if (!confirm('Excluir "' + culto.titulo + '"? Essa ação não pode ser desfeita.')) {
        return;
    }

    dados.cultos.splice(posicao, 1);  // splice(posição, 1) remove 1 item daquela posição
    guardarRascunho();
    mostrarCultos();
    limparFormularioCulto();
    avisar('Culto excluído.');
}

// Esvazia o formulário e volta ao modo "novo culto".
function limparFormularioCulto() {
    cultoEditando = null;
    const formulario = document.getElementById('form-culto');
    if (formulario === null) {
        return;
    }

    formulario.reset();
    document.getElementById('titulo-form-culto').textContent = 'Novo culto';
    document.getElementById('cancelar-culto').hidden = true;
}


// ============================================================
// COMUNICADOS (funciona igual aos cultos)
// ============================================================

function mostrarComunicados() {
    const lista = document.getElementById('lista-comunicados');
    if (lista === null) {
        return;  // a aba de comunicados não existe neste painel
    }

    let html = '';

    for (let i = 0; i < dados.comunicados.length; i++) {
        const comunicado = dados.comunicados[i];
        let etiqueta = limparTexto(comunicado.data);

        if (comunicado.destaque === false) {
            etiqueta += ' · só aparece em "Ver Todos"';
        }

        html += `
            <div class="item">
                <div class="item-info">
                    <span class="item-meta">${etiqueta}</span>
                    <h4>${limparTexto(comunicado.titulo)}</h4>
                    <p>${limparTexto(comunicado.texto)}</p>
                </div>
                <div class="item-botoes">
                    <button class="btn btn-linha btn-pequeno" onclick="editarComunicado(${i})">Editar</button>
                    <button class="btn btn-perigo btn-pequeno" onclick="excluirComunicado(${i})">Excluir</button>
                </div>
            </div>`;
    }

    if (html === '') {
        html = '<div class="vazio">Nenhum comunicado publicado ainda.</div>';
    }

    lista.innerHTML = html;
}

function salvarComunicado(evento) {
    evento.preventDefault();

    const comunicado = {
        data: document.getElementById('com-data').value,
        titulo: document.getElementById('com-titulo').value,
        texto: document.getElementById('com-texto').value,
        imagem: document.getElementById('com-imagem').value,
        destaque: document.getElementById('com-destaque').checked,
    };

    if (comunicadoEditando === null) {
        dados.comunicados.unshift(comunicado);  // novo comunicado vai para o começo (o mais recente primeiro)
        avisar('Comunicado criado. Lembre de baixar o dados.json para publicar.');
    } else {
        dados.comunicados[comunicadoEditando] = comunicado;
        avisar('Comunicado atualizado.');
    }

    guardarRascunho();
    mostrarComunicados();
    limparFormularioComunicado();
}

function editarComunicado(posicao) {
    const comunicado = dados.comunicados[posicao];

    document.getElementById('com-data').value = comunicado.data;
    document.getElementById('com-titulo').value = comunicado.titulo;
    document.getElementById('com-texto').value = comunicado.texto;
    document.getElementById('com-imagem').value = comunicado.imagem;
    document.getElementById('com-destaque').checked = comunicado.destaque !== false;

    comunicadoEditando = posicao;
    document.getElementById('titulo-form-comunicado').textContent = 'Editando comunicado';
    document.getElementById('cancelar-comunicado').hidden = false;
    document.getElementById('form-comunicado').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function excluirComunicado(posicao) {
    const comunicado = dados.comunicados[posicao];

    if (!confirm('Excluir "' + comunicado.titulo + '"? Essa ação não pode ser desfeita.')) {
        return;
    }

    dados.comunicados.splice(posicao, 1);
    guardarRascunho();
    mostrarComunicados();
    limparFormularioComunicado();
    avisar('Comunicado excluído.');
}

function limparFormularioComunicado() {
    comunicadoEditando = null;
    const formulario = document.getElementById('form-comunicado');
    if (formulario === null) {
        return;
    }

    formulario.reset();
    document.getElementById('titulo-form-comunicado').textContent = 'Novo comunicado';
    document.getElementById('cancelar-comunicado').hidden = true;
}


// ============================================================
// INÍCIO
// ============================================================

// Roda uma função. Se ela der erro, avisa no console (tecla F12) qual foi,
// e o resto do painel continua funcionando.
function executar(funcao) {
    try {
        funcao();
    } catch (erro) {
        console.error('Erro na função ' + funcao.name + ':', erro);
    }
}

async function iniciarPainel() {
    await carregarDados();
    executar(mostrarCultos);
    executar(mostrarComunicados);
}

iniciarPainel();