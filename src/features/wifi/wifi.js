/* ══ WIFI BUSINESS ══ */

const WIFI_IDENTIFICADOR_WRAP_ID = 'wifi-identificador-wrap';
const WIFI_IDENTIFICADOR_ID = 'wifi-identificador';
const WIFI_MAMBO_ID = 'wifi-mambo';

/* IDs já usados pelas VLANs fixas do formulário — não podem se repetir nas adicionais. */
const WIFI_VLANS_RESERVADAS = [20, 30, 40, 50, 60];

function wifiIpParaInt(ip) {
    const partes = ip.split('.');
    if (partes.length !== 4) return null;
    let n = 0;
    for (const octeto of partes) {
        if (!/^\d{1,3}$/.test(octeto)) return null;
        const v = parseInt(octeto, 10);
        if (v > 255) return null;
        n = n * 256 + v;
    }
    return n;
}

function wifiIntParaIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

/* Recebe "10.30.0.1/20" e devolve gateway, rede, pool e máscara já calculados. */
function wifiParseRede(valor) {
    const m = (valor || '').trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
    if (!m) return null;

    const gwInt = wifiIpParaInt(m[1]);
    const prefixo = parseInt(m[2], 10);
    if (gwInt === null || prefixo < 8 || prefixo > 30) return null;

    const mascara = (0xFFFFFFFF << (32 - prefixo)) >>> 0;
    const redeInt = (gwInt & mascara) >>> 0;
    const broadcastInt = (redeInt | (~mascara >>> 0)) >>> 0;

    // O gateway não pode ser o endereço de rede nem o de broadcast.
    if (gwInt === redeInt || gwInt === broadcastInt) return null;

    /* O pool ocupa toda a faixa útil da rede, pulando o gateway.
       No padrão do setor o gateway é o primeiro host e sai uma faixa só; num
       endereço digitado à mão o gateway pode cair no meio da rede (ex:
       10.40.8.1/20, que começa em 10.40.0.0), e aí sobram endereços antes
       dele — o RouterOS aceita as duas faixas separadas por vírgula. */
    const faixas = [];
    if (redeInt + 1 <= gwInt - 1) faixas.push([redeInt + 1, gwInt - 1]);
    if (gwInt + 1 <= broadcastInt - 1) faixas.push([gwInt + 1, broadcastInt - 1]);
    if (!faixas.length) return null;

    const poolTotal = faixas.reduce((soma, [ini, fim]) => soma + (fim - ini + 1), 0);

    return {
        gateway: wifiIntParaIp(gwInt),
        prefixo,
        gatewayCidr: `${wifiIntParaIp(gwInt)}/${prefixo}`,
        redeCidr: `${wifiIntParaIp(redeInt)}/${prefixo}`,
        poolRanges: faixas.map(([ini, fim]) => `${wifiIntParaIp(ini)}-${wifiIntParaIp(fim)}`).join(','),
        poolTotal,
        inicioInt: redeInt,
        fimInt: broadcastInt
    };
}

/* Duas faixas se sobrepõem quando uma começa antes da outra terminar. */
function wifiRedesSobrepostas(a, b) {
    return a.inicioInt <= b.fimInt && b.inicioInt <= a.fimInt;
}

/* Endereçamento padrão do setor: o número da VLAN vira o segundo octeto e a
   máscara é /20 — VLAN 40 → 10.40.0.1/20. A VLAN 20 (Hotspot) segue o mesmo
   padrão; a única que foge é a 60 (Gerência), que nasce /24. Nenhuma das duas
   é mais travada: viram VLAN comum, só com nome e rede pré-preenchidos. */
const WIFI_MASCARA_PADRAO = 20;
const WIFI_REDE_HOTSPOT_TXT = '10.20.0.1/20';
/* Rede da BRIDGE-LAN, usada para adoção dos APs — nasce em todo script. */
const WIFI_REDE_ADOCAO_TXT = '192.168.200.1/24';
const WIFI_REDE_GERENCIA_TXT = '10.60.0.1/24';

const WIFI_REDE_ADOCAO = wifiParseRede(WIFI_REDE_ADOCAO_TXT);

/* Endereço padrão de uma VLAN a partir do octeto que a representa. */
function wifiRedePadrao(octeto) {
    return `10.${octeto}.0.1/${WIFI_MASCARA_PADRAO}`;
}

/* Lê o campo de uma VLAN e sinaliza o campo em vermelho quando o valor não serve. */
function wifiLerRede(campoId) {
    const el = document.getElementById(campoId);
    if (!el) return null;
    const rede = wifiParseRede(el.value);
    el.classList.toggle('erro', !rede);
    return rede;
}

/* ── VLANs adicionais ── */

/* Normaliza o nome digitado para uso em identificadores do RouterOS. */
const WIFI_DIACRITICOS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');

function wifiNormalizarNome(txt) {
    return (txt || '').trim().toUpperCase()
        .normalize('NFD').replace(WIFI_DIACRITICOS, '')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

/* Monta os identificadores do RouterOS a partir do ID e do nome da VLAN.
   Sem nome, cai para o número: VLAN_70 / POOL_70 / DHCP_70 / REDE_70. */
function wifiIdentificadores(id, nomeDigitado) {
    const nome = wifiNormalizarNome(nomeDigitado);
    const sufixo = nome || String(id);
    return {
        nome,
        interface: nome ? `VLAN_${id}_${nome}` : `VLAN_${id}`,
        pool: `POOL_${sufixo}`,
        dhcp: `DHCP_${sufixo}`,
        comentario: `REDE_${sufixo}`
    };
}

/* Mostra quantos IPs o pool DHCP terá, embaixo de cada campo de rede. */
function wifiAtualizarHosts() {
    const campos = [
        ...['vlan20', 'vlan30', 'vlan40', 'vlan50', 'vlan60'].map(v => [document.getElementById(`${v}-rede`), document.getElementById(`${v}-hosts`)]),
        ...[...document.querySelectorAll('#wifi-vlans-extras .vlan-extra')].map(l => [l.querySelector('.vlan-rede'), l.querySelector('.vlan-hosts')])
    ];

    campos.forEach(([redeEl, hostsEl]) => {
        if (!redeEl || !hostsEl) return;
        const rede = wifiParseRede(redeEl.value);
        hostsEl.classList.toggle('invalido', !rede);
        hostsEl.textContent = rede ? `${rede.poolTotal} IPs no pool` : 'endereço inválido';
    });
}

/* Lê as linhas de VLAN adicionais já com a rede calculada e os campos validados. */
function wifiLerVlansExtras() {
    return [...document.querySelectorAll('#wifi-vlans-extras .vlan-extra')].map(linha => {
        const idEl = linha.querySelector('.vlan-id');
        const nomeEl = linha.querySelector('.vlan-nome');
        const redeEl = linha.querySelector('.vlan-rede');

        const id = parseInt(idEl.value, 10);
        const idValido = Number.isInteger(id) && id >= 2 && id <= 4094;
        const rede = wifiParseRede(redeEl.value);

        idEl.classList.toggle('erro', !idValido);
        redeEl.classList.toggle('erro', !rede);
        nomeEl.classList.remove('erro');

        return { id, idValido, rede, ids: wifiIdentificadores(id, nomeEl.value), idEl, nomeEl, redeEl };
    });
}

/* Redes já ocupadas na tela — usadas para sugerir uma faixa livre.
   `ignorarEl` deixa de fora o próprio campo que está sendo recalculado. */
function wifiRedesEmUso(ignorarEl) {
    const campos = [
        ...['vlan20-rede', 'vlan30-rede', 'vlan40-rede', 'vlan50-rede', 'vlan60-rede'].map(id => document.getElementById(id)),
        ...document.querySelectorAll('#wifi-vlans-extras .vlan-rede')
    ].filter(el => el && el !== ignorarEl);

    return [
        WIFI_REDE_ADOCAO_TXT,    // BRIDGE-LAN, criada em todo script
        ...campos.map(el => el.value)
    ].map(wifiParseRede).filter(Boolean);
}

/* Segue o padrão 10.<id>.0.1/20, pulando faixas que já estejam em uso.
   IDs acima de 254 não cabem no octeto e recebem uma faixa livre equivalente. */
function wifiSugerirRede(id, ignorarEl) {
    const emUso = wifiRedesEmUso(ignorarEl);
    let octeto = (id >= 1 && id <= 254) ? id : ((id % 254) || 254);

    for (let tentativa = 0; tentativa < 254; tentativa++) {
        const candidato = wifiRedePadrao(octeto);
        const rede = wifiParseRede(candidato);
        if (rede && !emUso.some(r => wifiRedesSobrepostas(r, rede))) return candidato;
        octeto = (octeto % 254) + 1;
    }
    return wifiRedePadrao(octeto);
}

export function wifiAdicionarVlan() {
    const usados = [
        ...WIFI_VLANS_RESERVADAS,
        ...wifiLerVlansExtras().filter(v => v.idValido).map(v => v.id)
    ];

    // Sugere o próximo múltiplo de 10 livre (70, 80, 90...).
    let sugestao = Math.max(60, ...usados);
    do { sugestao += 10; } while (usados.includes(sugestao) && sugestao < 4090);
    if (sugestao > 4094) sugestao = 4094;

    // Segue a sequência WIFI-CORP1/2/3 das VLANs fixas (30/40/50) para as adicionais.
    const corpIndex = 3 + document.querySelectorAll('#wifi-vlans-extras .vlan-extra').length + 1;

    const linha = document.createElement('div');
    linha.className = 'vlan-row vlan-extra';
    linha.innerHTML = `
<span class="vlan-id-wrap"><span class="vlan-tag">VLAN</span><input type="text" class="vlan-id" value="${sugestao}" inputmode="numeric" maxlength="4" aria-label="ID da VLAN"></span>
<input type="text" class="vlan-nome" value="WIFI-CORP${corpIndex}" spellcheck="false" aria-label="Nome da VLAN">
<span class="vlan-rede-wrap"><input type="text" class="vlan-rede" value="${wifiSugerirRede(sugestao)}" data-auto="1" spellcheck="false" title="Segue o número da VLAN automaticamente até você editar" aria-label="Endereçamento da VLAN"><small class="vlan-hosts"></small></span>
<button type="button" class="vlan-remover" title="Remover esta VLAN">&times;</button>`;

    document.getElementById('wifi-vlans-extras').appendChild(linha);
    wifiAtualizarHosts();
    linha.querySelector('.vlan-nome').select();
}

/* Ao trocar o ID, a rede acompanha o padrão 10.<id>.0.1/20 —
   a menos que o endereço já tenha sido digitado à mão. */
function wifiIdMudou(idEl) {
    const redeEl = idEl.closest('.vlan-extra').querySelector('.vlan-rede');
    if (!redeEl.hasAttribute('data-auto')) return;

    const id = parseInt(idEl.value, 10);
    if (!Number.isInteger(id) || id < 2 || id > 4094) return;

    redeEl.value = wifiSugerirRede(id, redeEl);
    redeEl.classList.remove('erro');
    wifiAtualizarHosts();
}

/* Endereço editado manualmente deixa de seguir o ID. */
function wifiRedeEditada(redeEl) {
    redeEl.removeAttribute('data-auto');
    wifiAtualizarHosts();
}

function wifiRemoverVlan(btn) {
    btn.closest('.vlan-extra').remove();
    wifiAtualizarHosts();
}

/* Delegação de eventos das linhas adicionais — cobre inputs/botões criados dinamicamente. */
function wifiWireVlansExtras() {
    const extras = document.getElementById('wifi-vlans-extras');
    if (!extras || extras.dataset.wired) return;
    extras.dataset.wired = '1';

    extras.addEventListener('click', (e) => {
        if (e.target.classList.contains('vlan-remover')) wifiRemoverVlan(e.target);
    });

    extras.addEventListener('input', (e) => {
        if (e.target.classList.contains('vlan-id')) wifiIdMudou(e.target);
        else if (e.target.classList.contains('vlan-rede')) wifiRedeEditada(e.target);
        else wifiAtualizarHosts();
    });
}

/* Portas marcadas para entrar na BRIDGE-LAN. */
function wifiPortasSelecionadas() {
    return [...document.querySelectorAll('#wifi-portas input[type=checkbox]:checked')]
        .map(cb => `ether${cb.value}`);
}

/* Copia garantindo quebra de linha no fim: sem ela, o terminal do MikroTik
   deixa o último comando no buffer sem executar. */
function wifiCopiarTexto(texto) {
    navigator.clipboard.writeText(texto.replace(/\s+$/, '') + '\n');
}

/* Converte o script exibido em conteúdo .rsc válido para /import:
   tudo que não é comando do RouterOS vira comentário. */
function wifiScriptParaRsc(texto, titulo = 'Wifi Business') {
    const comando = /^(\/|:)|^[a-z][a-z0-9._-]*(\s|$)/;
    const corpo = texto.split('\n').map(linha => {
        const t = linha.trim();
        if (t === '' || t.startsWith('#')) return linha;
        return comando.test(t) ? linha : `# ${t}`;
    }).join('\n');

    const agora = new Date().toLocaleString('pt-BR');
    return `# ${titulo} - script gerado pelo Painel de Ferramentas CRC\n# ${agora}\n# Importar no MikroTik com: /import file-name=<arquivo>.rsc\n\n${corpo}\n`;
}

export function wifiBaixarRsc() {
    const texto = document.getElementById('wifi-resultado').textContent;
    if (!texto || texto === '—') { alert('Gere o script primeiro!'); return; }

    const identificador = wifiNormalizarNome(document.getElementById('wifi-identificador').value);
    const data = new Date().toISOString().slice(0, 10);
    const nomeArquivo = `wifi-business${identificador ? '-' + identificador.toLowerCase() : ''}-${data}.rsc`;

    const blob = new Blob([wifiScriptParaRsc(texto)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    const msg = document.getElementById('wifi-copiado');
    msg.textContent = `✓ ${nomeArquivo} baixado — importe com /import file-name=${nomeArquivo}`;
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
        msg.textContent = '✓ Script copiado para a área de transferência!';
    }, 4000);
}

export function wifiHotspotChange() {
    const select = document.getElementById(WIFI_MAMBO_ID);
    const wrap = document.getElementById(WIFI_IDENTIFICADOR_WRAP_ID);
    const input = document.getElementById(WIFI_IDENTIFICADOR_ID);
    if (!select || !wrap || !input) return;

    const mostra = select.value === 'mambo';
    wrap.style.display = mostra ? 'block' : 'none';
    if (!mostra) input.value = '';

    // Sem Hotspot, a VLAN 20 não faz sentido: trava desmarcada e fora de edição.
    const vlan20 = document.getElementById('vlan20');
    if (vlan20) {
        if (select.value === 'nao') {
            vlan20.checked = false;
            vlan20.disabled = true;
            vlan20.title = 'Selecione um Hotspot (Mambo ou Wifeed) para habilitar a VLAN 20';
        } else {
            vlan20.disabled = false;
            vlan20.checked = true;
            vlan20.title = '';
        }
    }

    /* O endereço da VLAN 20 só é aplicado no MikroTik quando o Hotspot é
       Mambo — sem Hotspot não há por que configurá-lo, e com Wifeed quem
       configura a rede de verdade é o painel do Wifeed, do outro lado (o
       valor aqui só serve de base para os campos traduzidos ao lado). Fica
       visível mas travado no padrão do setor nos outros dois casos. */
    const vlan20Rede = document.getElementById('vlan20-rede');
    if (vlan20Rede) {
        const editavel = select.value === 'mambo';
        if (!editavel) vlan20Rede.value = WIFI_REDE_HOTSPOT_TXT;
        vlan20Rede.disabled = !editavel;
        vlan20Rede.title = editavel ? '' : (select.value === 'wifeed'
            ? 'O Wifeed gerencia este endereçamento — veja o aviso ao lado'
            : 'Selecione o Hotspot Mambo para editar o endereçamento da VLAN 20');
    }

    wifiAtualizarWifeed();
}

/* ── apoio à configuração do Wifeed ──

   A VLAN 20 é a do hotspot. Quando ela recebe uma rede, é porque o cliente vai
   ser integrado ao Wifeed depois — e quem configura lá do outro lado precisa
   dos mesmos números que estão aqui. Este bloco traduz o endereçamento para os
   campos que o painel do Wifeed pede, para ninguém ter que converter máscara
   na mão nem descobrir a faixa por tentativa. */

/* /20 vira 255.255.240.0 — o Wifeed pede a máscara em decimal.
   Sem prefixo válido devolve vazio: melhor faltar o campo do que entregar uma
   máscara plausível e errada para quem vai configurar do outro lado. */
function wifiMascaraDecimal(prefixo) {
    if (!Number.isInteger(prefixo) || prefixo < 1 || prefixo > 32) return '';
    return wifiIntParaIp(((0xFFFFFFFF << (32 - prefixo)) >>> 0));
}

const WIFI_DNS = '8.8.8.8,8.8.4.4';

/* Fonte única dos campos: a tela e o texto copiado saem os dois daqui, na
   ordem em que aparecem no painel do Wifeed. */
function wifiCamposWifeed(rede) {
    if (!rede) return null;
    return [
        { grupo: 'Rede', rotulo: 'Endereço IP', valor: rede.gateway },
        { grupo: 'Rede', rotulo: 'Máscara de Rede', valor: wifiMascaraDecimal(rede.prefixo) },
        { grupo: 'Rede', rotulo: 'Faixa de IP', valor: rede.poolRanges },
        { grupo: 'Rede', rotulo: 'Servidores DNS', valor: WIFI_DNS },
        { grupo: 'Mikrotik', rotulo: 'Interface LAN', valor: 'VLAN_20_HOTSPOT' },
        { grupo: 'Mikrotik', rotulo: 'Virtual LAN', valor: '20' }
    ];
}

/* Mesmo conteúdo da tela, em texto — para colar no chamado. */
function wifiDadosWifeed(rede) {
    const campos = wifiCamposWifeed(rede);
    if (!campos) return null;

    const linhas = [];
    let grupoAtual = '';
    campos.forEach(c => {
        if (c.grupo !== grupoAtual) {
            if (grupoAtual) linhas.push('');
            linhas.push(c.grupo.toUpperCase());
            grupoAtual = c.grupo;
        }
        linhas.push(`${c.rotulo}: ${c.valor}`);
    });
    return linhas.join('\n');
}

function wifiEscapar(txt) {
    return String(txt).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* Desenha os campos agrupados como no painel do Wifeed, cada um com cópia
   individual — na hora de transcrever, é campo a campo. */
function wifiDesenharWifeed(campos) {
    const grupos = [];
    campos.forEach(c => {
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.nome === c.grupo) ultimo.itens.push(c);
        else grupos.push({ nome: c.grupo, itens: [c] });
    });

    return grupos.map(g => `<div class="wf-grupo">
    <h4>${wifiEscapar(g.nome)}</h4>
    ${g.itens.map(c => `<div class="wf-campo">
        <span class="wf-texto">
            <span class="wf-rotulo">${wifiEscapar(c.rotulo)}</span>
            <span class="wf-valor">${wifiEscapar(c.valor)}</span>
        </span>
        <button type="button" class="wf-copia" data-copiar-campo title="Copiar ${wifiEscapar(c.rotulo)}" aria-label="Copiar ${wifiEscapar(c.rotulo)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
    </div>`).join('\n')}
</div>`).join('\n');
}

/* Mostra ou esconde o bloco conforme o hotspot escolhido, e mantém os números
   em dia enquanto a rede da VLAN 20 é editada. */
function wifiAtualizarWifeed() {
    const caixa = document.getElementById('wifi-wifeed-apoio');
    if (!caixa) return;

    const ehWifeed = document.getElementById('wifi-mambo').value === 'wifeed';
    caixa.style.display = ehWifeed ? 'block' : 'none';
    if (!ehWifeed) return;

    const rede = wifiParseRede(document.getElementById('vlan20-rede').value);
    const campos = wifiCamposWifeed(rede);
    const alvo = document.getElementById('wifi-wifeed-campos');

    const alertaRede = document.getElementById('wifi-alerta-rede');
    if (alertaRede) alertaRede.textContent = rede ? rede.gatewayCidr : 'a definir';

    /* A nota é sempre recalculada, inclusive quando some — senão ela sobra na
       tela descrevendo uma rede que não está mais no campo. */
    const nota = document.getElementById('wifi-wifeed-nota');
    nota.style.display = 'none';

    if (!campos) {
        alvo.innerHTML = '<p class="wf-vazio">Informe a rede da VLAN 20 para o painel calcular os campos.</p>';
        return;
    }
    alvo.innerHTML = wifiDesenharWifeed(campos);

    /* Gateway fora do primeiro host parte o pool em duas faixas, e o campo do
       Wifeed aceita só uma. Melhor avisar aqui do que descobrir lá. */
    const partido = rede.poolRanges.includes(',');
    nota.style.display = partido ? 'block' : 'none';
    if (partido) {
        nota.textContent = 'A faixa saiu partida em duas porque o gateway não é o primeiro host da rede. ' +
            'O campo do Wifeed aceita uma faixa só — use a maior, ou mude o gateway para o primeiro endereço.';
    }
}

/* Copia o valor de um campo isolado, para transcrever no Wifeed sem erro de digitação. */
function wifiCopiarCampo(btn) {
    const valor = btn.closest('.wf-campo').querySelector('.wf-valor').textContent;
    wifiCopiarTexto(valor);

    btn.classList.add('wf-copiado');
    setTimeout(() => btn.classList.remove('wf-copiado'), 1200);
}

/* Delegação de eventos dos botões de copiar campo — os campos são redesenhados a cada cálculo. */
function wifiWireWifeedCampos() {
    const alvo = document.getElementById('wifi-wifeed-campos');
    if (!alvo || alvo.dataset.wired) return;
    alvo.dataset.wired = '1';

    alvo.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-copiar-campo]');
        if (btn) wifiCopiarCampo(btn);
    });
}

export function wifiCopiarWifeed() {
    const rede = wifiParseRede(document.getElementById('vlan20-rede').value);
    const dados = wifiDadosWifeed(rede);
    if (!dados) { alert('Informe a rede da VLAN 20 primeiro.'); return; }

    wifiCopiarTexto(dados);
    const msg = document.getElementById('wifi-copiado');
    msg.textContent = '✓ Dados do Wifeed copiados!';
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
        msg.textContent = '✓ Script copiado para a área de transferência!';
    }, 2600);
}

export function wifiLimpar() {
    document.getElementById('wifi-ap').selectedIndex = 0;
    document.getElementById('wifi-mambo').selectedIndex = 0;
    document.getElementById('wifi-identificador').value = '';
    document.getElementById('wifi-identificador-wrap').style.display = 'none';

    const padroes = { vlan20: true, vlan30: false, vlan40: true, vlan50: false, vlan60: true };
    Object.entries(padroes).forEach(([id, marcado]) => {
        document.getElementById(id).checked = marcado;
    });

    const camposPadrao = {
        'vlan20-rede': WIFI_REDE_HOTSPOT_TXT,
        'vlan30-nome': 'WIFI-CORP1', 'vlan30-rede': wifiRedePadrao(30),
        'vlan40-nome': 'WIFI-CORP2', 'vlan40-rede': wifiRedePadrao(40),
        'vlan50-nome': 'WIFI-CORP3', 'vlan50-rede': wifiRedePadrao(50),
        'vlan60-nome': 'GERENCIA', 'vlan60-rede': WIFI_REDE_GERENCIA_TXT
    };
    Object.entries(camposPadrao).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        el.value = valor;
        el.classList.remove('erro');
    });

    document.getElementById('wifi-vlans-extras').innerHTML = '';

    document.querySelectorAll('#wifi-portas input[type=checkbox]').forEach(cb => {
        cb.checked = cb.value === '5';
    });
    wifiAtualizarHosts();

    // VLAN 20 depende do Hotspot selecionado (acabou de voltar para "Não") — atualiza junto o apoio Wifeed.
    wifiHotspotChange();

    const res = document.getElementById('wifi-resultado');
    res.style.display = 'none';
    res.textContent = '—';
    document.getElementById('wifi-copiado').style.display = 'none';
}

export function wifiGerar() {
    const ap = document.getElementById('wifi-ap').value;
    const hotspot = document.getElementById('wifi-mambo').value;
    const identificador = document.getElementById('wifi-identificador').value.trim();

    // Sem Hotspot a VLAN 20 nunca entra no script, mesmo que o checkbox esteja marcado.
    const v20 = hotspot !== 'nao' && document.getElementById('vlan20').checked;
    const v30 = document.getElementById('vlan30').checked;
    const v40 = document.getElementById('vlan40').checked;
    const v50 = document.getElementById('vlan50').checked;
    const v60 = document.getElementById('vlan60').checked;

    if (hotspot === 'mambo' && !identificador) {
        alert('Para gerar o script Mambo, digite o Identificador!');
        return;
    }
    if (hotspot === 'mambo' && !v20) {
        alert('O Hotspot Mambo exige que a VLAN 20 seja criada. Marque a VLAN 20.');
        return;
    }

    // Endereçamento: todas as redes vêm dos campos.
    const hs = v20 ? wifiLerRede('vlan20-rede') : null;
    const r30 = v30 ? wifiLerRede('vlan30-rede') : null;
    const r40 = v40 ? wifiLerRede('vlan40-rede') : null;
    const r50 = v50 ? wifiLerRede('vlan50-rede') : null;
    const r60 = v60 ? wifiLerRede('vlan60-rede') : null;

    // Nomes editáveis (Hotspot é o único com nome fixo).
    const n30 = wifiIdentificadores(30, document.getElementById('vlan30-nome').value);
    const n40 = wifiIdentificadores(40, document.getElementById('vlan40-nome').value);
    const n50 = wifiIdentificadores(50, document.getElementById('vlan50-nome').value);
    const n60 = wifiIdentificadores(60, document.getElementById('vlan60-nome').value);
    ['vlan30-nome', 'vlan40-nome', 'vlan50-nome', 'vlan60-nome'].forEach(id => document.getElementById(id).classList.remove('erro'));

    const portas = wifiPortasSelecionadas();
    if (!portas.length) {
        alert('Marque pelo menos uma porta para a BRIDGE-LAN.');
        return;
    }

    const extras = wifiLerVlansExtras();

    const invalidas = [];
    if (v20 && !hs) invalidas.push('VLAN 20');
    if (v30 && !r30) invalidas.push('VLAN 30');
    if (v40 && !r40) invalidas.push('VLAN 40');
    if (v50 && !r50) invalidas.push('VLAN 50');
    if (v60 && !r60) invalidas.push('VLAN 60');
    extras.forEach((v, i) => {
        if (!v.idValido) invalidas.push(`VLAN adicional #${i + 1} (ID precisa ficar entre 2 e 4094)`);
        else if (!v.rede) invalidas.push(`VLAN ${v.id}`);
    });
    if (invalidas.length) {
        alert(`Endereçamento inválido em: ${invalidas.join(', ')}.\n\nInforme o IP do gateway com a máscara, por exemplo ${wifiRedePadrao(30)}.`);
        return;
    }

    // Cada VLAN precisa de um ID próprio.
    const idsVistos = [];
    for (const v of extras) {
        const repetida = WIFI_VLANS_RESERVADAS.includes(v.id) || idsVistos.includes(v.id);
        if (repetida) {
            v.idEl.classList.add('erro');
            alert(`A VLAN ${v.id} está duplicada. Cada VLAN precisa de um ID único — os IDs ${WIFI_VLANS_RESERVADAS.join(', ')} já são usados pela lista fixa.`);
            return;
        }
        idsVistos.push(v.id);
    }

    // Nomes repetidos gerariam pools e servidores DHCP com o mesmo identificador.
    const nomeados = [
        v20 && { rotulo: 'VLAN 20', nome: 'HOTSPOT' },
        v30 && { rotulo: 'VLAN 30', nome: n30.nome, el: document.getElementById('vlan30-nome') },
        v40 && { rotulo: 'VLAN 40', nome: n40.nome, el: document.getElementById('vlan40-nome') },
        v50 && { rotulo: 'VLAN 50', nome: n50.nome, el: document.getElementById('vlan50-nome') },
        v60 && { rotulo: 'VLAN 60', nome: n60.nome, el: document.getElementById('vlan60-nome') },
        ...extras.map(v => ({ rotulo: `VLAN ${v.id}`, nome: v.ids.nome, el: v.nomeEl }))
    ].filter(item => item && item.nome);

    for (let i = 0; i < nomeados.length; i++) {
        for (let j = i + 1; j < nomeados.length; j++) {
            if (nomeados[i].nome === nomeados[j].nome) {
                if (nomeados[j].el) nomeados[j].el.classList.add('erro');
                alert(`A ${nomeados[i].rotulo} e a ${nomeados[j].rotulo} usam o mesmo nome (${nomeados[i].nome}).\n\nCada VLAN precisa de um nome próprio — ele identifica o pool e o servidor DHCP.`);
                return;
            }
        }
    }

    // Duas VLANs não podem dividir a mesma faixa de IP.
    const ativas = [
        { rotulo: 'BRIDGE-LAN (adoção)', rede: WIFI_REDE_ADOCAO },
        v20 && { rotulo: 'VLAN 20', rede: hs, el: document.getElementById('vlan20-rede') },
        v30 && { rotulo: 'VLAN 30', rede: r30, el: document.getElementById('vlan30-rede') },
        v40 && { rotulo: 'VLAN 40', rede: r40, el: document.getElementById('vlan40-rede') },
        v50 && { rotulo: 'VLAN 50', rede: r50, el: document.getElementById('vlan50-rede') },
        v60 && { rotulo: 'VLAN 60', rede: r60, el: document.getElementById('vlan60-rede') },
        ...extras.map(v => ({ rotulo: `VLAN ${v.id}`, rede: v.rede, el: v.redeEl }))
    ].filter(Boolean);

    for (let i = 0; i < ativas.length; i++) {
        for (let j = i + 1; j < ativas.length; j++) {
            if (wifiRedesSobrepostas(ativas[i].rede, ativas[j].rede)) {
                if (ativas[j].el) ativas[j].el.classList.add('erro');
                alert(`A rede da ${ativas[i].rotulo} (${ativas[i].rede.redeCidr}) e a da ${ativas[j].rotulo} (${ativas[j].rede.redeCidr}) se sobrepõem.\n\nCada VLAN precisa de uma faixa própria.`);
                return;
            }
        }
    }

    // 1. BLOCO BÁSICO (Obrigatório para todos)
    const removePortas = portas.map(p => `/interface bridge port remove [find interface=${p}]`).join('\n');
    const addPortas = portas.map(p => `/interface bridge port add interface=${p} bridge=BRIDGE-LAN`).join('\n');

    let script = `#BASICO\n/user add name=admin.local password=#@!4432dDA45 group=full\n/ip dns set servers=${WIFI_DNS}\n#PORTAS DA BRIDGE-LAN: ${portas.join(', ')}\n${removePortas}\n/interface bridge add name=BRIDGE-LAN protocol-mode=rstp\n${addPortas}\n/ip address add address=192.168.200.1/24 interface=BRIDGE-LAN\n/ip pool add name=POOL_BRIDGE_LAN ranges=192.168.200.2-192.168.200.254\n\n`;

    // 2. BLOCO ADOÇÃO (Dinâmico)
    if (ap === 'tplink') {
        script += `#ADOCAO TPLINK\n/ip dhcp-server network add address=192.168.200.0/24 gateway=192.168.200.1 dns-server=${WIFI_DNS} caps-manager=187.85.164.32 comment=ADOTA_TPLINK_NO_CAPS_MANAGERS\n/ip dhcp-server add name=DHCP_ADOCAO lease-time=00:10:00 address-pool=POOL_BRIDGE_LAN interface=BRIDGE-LAN authoritative=yes add-arp=yes disabled=no\n/ip firewall nat add chain=srcnat src-address=192.168.200.0/24 action=masquerade comment=REDE_ADOCAO\n\n`;
    } else if (ap === 'unifi') {
        script += `#DHCP UNIFI\n/ip dhcp-server add name=DHCP_ADOCAO lease-time=00:10:00 address-pool=POOL_BRIDGE_LAN interface=BRIDGE-LAN authoritative=yes add-arp=yes disabled=no\n/ip dhcp-server network add address=192.168.200.0/24 gateway=192.168.200.1 dns-server=${WIFI_DNS} comment=REDE_ADOCAO\n/ip firewall nat add chain=srcnat src-address=192.168.200.0/24 action=masquerade comment=REDE_ADOCAO\n\n`;
    }

    // 3. CRIAÇÃO DAS VLANS (Dinâmico)
    if (v20 || v30 || v40 || v50 || v60 || extras.length) script += `#ADICIONAR VLANS\n`;
    if (v20) script += `/interface vlan add name=VLAN_20_HOTSPOT vlan-id=20 interface=BRIDGE-LAN\n`;
    if (v30) script += `/interface vlan add name=${n30.interface} vlan-id=30 interface=BRIDGE-LAN\n`;
    if (v40) script += `/interface vlan add name=${n40.interface} vlan-id=40 interface=BRIDGE-LAN\n`;
    if (v50) script += `/interface vlan add name=${n50.interface} vlan-id=50 interface=BRIDGE-LAN\n`;
    if (v60) script += `/interface vlan add name=${n60.interface} vlan-id=60 interface=BRIDGE-LAN\n`;
    extras.forEach(v => {
        script += `/interface vlan add name=${v.ids.interface} vlan-id=${v.id} interface=BRIDGE-LAN\n`;
    });
    script += `\n`;

    // 4. IP, DHCP E NAT (Dinâmico)
    const blocoVlan = (id, ids, r, leaseTime) =>
        `#ADDRESS ${ids.comentario} ->>>>>>>>> ${ids.comentario} - VLAN_${id}\n/ip address add address=${r.gatewayCidr} interface=${ids.interface} disabled=no\n/ip pool add name=${ids.pool} ranges=${r.poolRanges}\n/ip dhcp-server network add address=${r.redeCidr} gateway=${r.gateway} dns-server=${WIFI_DNS}\n/ip dhcp-server add name=${ids.dhcp} lease-time=${leaseTime} address-pool=${ids.pool} interface=${ids.interface} authoritative=yes add-arp=yes disabled=no conflict-detection=no\n/ip firewall nat add chain=srcnat src-address=${r.redeCidr} action=masquerade comment=${ids.comentario}\n\n`;

    if (v60) script += blocoVlan(60, n60, r60, '01:59:00');
    if (v50) script += blocoVlan(50, n50, r50, '00:15:00');
    if (v40) script += blocoVlan(40, n40, r40, '00:30:00');
    if (v30) script += blocoVlan(30, n30, r30, '00:30:00');

    extras.forEach(v => script += blocoVlan(v.id, v.ids, v.rede, '00:30:00'));

    if (v20 && hotspot === 'mambo') {
        script += `#ADDRESS HOTSPOT ->>>>>>>>> REDE_HOTSPOT - VLAN_20\n/ip address add address=${hs.gatewayCidr} interface=VLAN_20_HOTSPOT\n/ip pool add name=POOL_HOTSPOT ranges=${hs.poolRanges}\n/ip dhcp-server network add address=${hs.redeCidr} gateway=${hs.gateway} dns-server=${WIFI_DNS}\n/ip dhcp-server add name=DHCP_HOTSPOT lease-time=00:15:00 address-pool=POOL_HOTSPOT interface=VLAN_20_HOTSPOT authoritative=yes add-arp=yes disabled=no\n/ip firewall nat add chain=srcnat src-address=${hs.redeCidr} action=masquerade comment=REDE_HOTSPOT\n\n`;
    } 

    // 5. ISOLAMENTO (Sempre forçado e Dinâmico - isola automaticamente o que foi criado)
    if (v20 || v30 || v40 || v50 || extras.length) {
        if (v20) script += `/ip firewall address-list add address=${hs.redeCidr} list=BLOCK_REDES\n`;
        if (v30) script += `/ip firewall address-list add address=${r30.redeCidr} list=BLOCK_REDES\n`;
        if (v40) script += `/ip firewall address-list add address=${r40.redeCidr} list=BLOCK_REDES\n`;
        if (v50) script += `/ip firewall address-list add address=${r50.redeCidr} list=BLOCK_REDES\n`;
        extras.forEach(v => script += `/ip firewall address-list add address=${v.rede.redeCidr} list=BLOCK_REDES\n`);

        if (v30) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=${r30.redeCidr}\n`;
        if (v40) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=${r40.redeCidr}\n`;
        if (v50) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=${r50.redeCidr}\n`;
        extras.forEach(v => script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=${v.rede.redeCidr}\n`);
        if (v20) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=${hs.redeCidr} dst-address=!${hs.gateway}\n`;

        if (v30) {
            script += `\n#BLOCK RAW CONTROLE POR IP\n/ip firewall raw add chain=prerouting src-address=${r30.redeCidr} src-address-list=LIBERA_ACESSO action=accept disabled=yes\n/ip firewall address-list add list=LIBERA_ACESSO address=8.8.4.4\n/ip firewall raw add chain=prerouting src-address=${r30.redeCidr}  action=drop disabled=yes\n\n`;
        }
    }

    // 6. SCRIPT MAMBO (somente quando 'Sim, com Mambo' selecionado)
    if (hotspot === 'mambo') {
        script += `HOTSPOT MAMBO ->>>>>>>>> SCRIPT\n\n/ip hotspot add addresses-per-mac=unlimited disabled=no interface=VLAN_20_HOTSPOT name=${identificador} address-pool=POOL_HOTSPOT\n/ip hotspot profile set [ find default=yes ] login-by=http-pap,mac-cookie radius-mac-format=XX-XX-XX-XX-XX-XX use-radius=yes radius-interim-update=00:15:00 radius-default-domain=mambo\n/ip hotspot user profile set [ find default=yes ] idle-timeout=10m keepalive-timeout=10m\n/ip hotspot profile set [find name=default] hotspot-address=${hs.gateway}\n \n/ip hotspot walled-garden\nadd dst-host=mambowifi\nadd dst-host=unifique\n\n#facebook\nadd dst-host=facebook.com disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=akamai disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=facebook.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=fbcdn.net disabled=yes comment=Ativar_autenticar_rede_sociais\n\n#twitter\nadd dst-host=twitter disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=twimg disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=fastly.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=edgecastcdn.net disabled=yes comment=Ativar_autenticar_rede_sociais\n\n#instagram\nadd dst-host=instagram.com disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=doubleclick.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=www.google.com \nadd dst-host=www.google.com.br \n\n/ip firewall address-list add address=uploads.mambowifi.com list=mambo\n/ip firewall address-list add address=mambowifi.com list=mambo\n/ip firewall address-list add address=unifique.com.br list=mambo\n/ip firewall address-list add address=facebook.com list=facebook\n/ip firewall address-list add address=facebook.net list=facebook\n/ip firewall address-list add address=akamaihd.net list=facebook\n/ip firewall address-list add address=fbcdn.net list=facebook\n/ip firewall address-list add address=www.googleapis.com list=google\n/ip firewall address-list add address=ssl.gstatic.com list=google\n/ip firewall address-list add address=fonts.gstatic.com list=google\n/ip firewall address-list add address=www.gstatic.com list=google\n/ip firewall address-list add address=accounts.google.com list=google\n/ip firewall address-list add address=accounts.youtube.com list=google\n/ip firewall address-list add address=accounts.google.com.br list=google\n/ip firewall address-list add address=gstatic.com list=google\n/ip firewall address-list add address=twitter.com list=twitter\n/ip firewall address-list add address=twimg.com list=twitter\n/ip firewall address-list add address=abs.twitter.com list=twitter\n\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address-list=mambo\n/ip hotspot walled-garden ip add action=accept disabled=yes dst-address-list=facebook comment=Ativar_autenticar_rede_sociais\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address-list=google \n/ip hotspot walled-garden ip add action=accept disabled=yes dst-address-list=twitter comment=Ativar_autenticar_rede_sociais\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address=168.138.229.153 !dst-address-list !dst-port !protocol !src-address !src-address-list\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address=168.138.226.107 !dst-address-list !dst-port !protocol !src-address !src-address-list\n \n/radius add address=168.138.226.107 secret="wide\\$123" service=hotspot domain=mambo timeout=00:00:03\n/radius add address=168.138.229.153 secret="wide\\$123" service=hotspot domain=mambo timeout=00:00:03\n/ip firewall nat add chain=srcnat  src-address=168.138.226.107 action=masquerade comment=RADIUS-MAMBO\n/ip firewall nat add chain=srcnat  src-address=168.138.229.153 action=masquerade comment=RADIUS-MAMBO\n\n`;
    }

    /* Masquerade geral: fecha a saida de qualquer rede que nao tenha regra
       propria. Fica por ultimo de proposito — a primeira regra que casa encerra
       o srcnat, e um masquerade sem filtro casa com tudo, entao qualquer regra
       especifica depois dele seria letra morta. */
    script += `\n#MASQUERADE GERAL\n/ip firewall nat add chain=srcnat action=masquerade\n\n`;

    // 7. INSTRUÇÕES UNIFI
    if (ap === 'unifi') {
        script += `\n========== INSTRUÇÕES DE ADOÇÃO UNIFI ==========\nACESSANDO O UNIFI\nNo terminal da MikroTik, digite o seguinte comando e insira o IP do AP no lugar dos "x": system ssh user=ubnt xxx.xxx.xxx.xxx\nQuando solicitado, insira a senha do dispositivo UniFi. O padrão é geralmente "ubnt". Pressione Enter após inserir a senha.\n\nCONFIGURANDO O UNIFI\nApós se conectar ao UniFi, digite o seguinte comando: set-inform http://187.85.164.26:8880/inform\nEsse comando informa ao AP UniFi onde encontrar a controladora.\n\nRESETANDO O UNIFI\nPara resetar o AP, é preciso acessa-lo e digitar o seguinte comando: syswrapper.sh restore-default\n\nREINICIANDO O UNIFI\nSe o AP UniFi ainda não subir, você pode reiniciá-lo manualmente.\nNo terminal do UniFi, digite o comando: Reboot now\n`;
    }

    const resBox = document.getElementById('wifi-resultado');
    resBox.style.display = 'block';
    resBox.textContent = script;

    wifiAtualizarWifeed();
}

export function wifiCopiar() {
    const texto = document.getElementById('wifi-resultado').textContent;
    if (texto === '—') {
        alert('Gere o script primeiro!');
        return;
    }
    wifiCopiarTexto(texto);
    const msg = document.getElementById('wifi-copiado');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 1800);
}

/* Inicializa listeners que dependem de elementos dinâmicos ou de eventos
   além de clique (input, delegação nas VLANs adicionais e nos campos do Wifeed). */
export function initWifi() {
    wifiAtualizarHosts();
    wifiWireVlansExtras();
    wifiWireWifeedCampos();
    wifiHotspotChange(); // sincroniza o estado inicial da VLAN 20 (e o apoio Wifeed) com o Hotspot selecionado

    ['vlan20-rede', 'vlan30-rede', 'vlan40-rede', 'vlan50-rede', 'vlan60-rede'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            wifiAtualizarHosts();
            wifiAtualizarWifeed();
        });
    });

    const btnAdd = document.getElementById('wifi-add-vlan');
    if (btnAdd) btnAdd.addEventListener('click', wifiAdicionarVlan);

    const btnRsc = document.getElementById('wifi-baixar-rsc');
    if (btnRsc) btnRsc.addEventListener('click', wifiBaixarRsc);
}
