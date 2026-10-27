const MAC_MODELOS = {
    'E50UG/RBGR3': { total: 5, tipos: Array(5).fill('ether') },
    'RB2011': { total: 10, tipos: Array(10).fill('ether') },
    'RB3011': { total: 11, tipos: [...Array(10).fill('ether'), 'sfp'] },
    'RB4011': { total: 11, tipos: [...Array(10).fill('ether'), 'sfp'] },
    'CCR2004-16G-2S+': { total: 18, tipos: [...Array(16).fill('ether'), 'sfp', 'sfp'] },
    'CCR2004-1G-12S+2XS': { total: 15, tipos: ['ether', ...Array(14).fill('sfp')] }
};

const MAC_MODELO_PADRAO = 'RB4011';

let macGerados = [];

// --- FUNÇÕES PURAS DE APOIO ---

function macTipoLabel(tipo) {
    if (tipo === 'ether') return 'Ethernet';
    if (tipo === 'sfp') return 'SFP';
    return 'Serial';
}

function macInterfaceLabel(modelo, porta, tipo) {
    if (modelo === 'CCR2004-1G-12S+2XS') return porta === 1 ? 'ether1' : `sfp${porta - 1}`;
    if (tipo === 'ether') return `ether${porta}`;
    if (tipo === 'sfp') return `sfp${modelo === 'CCR2004-16G-2S+' ? porta - 16 : porta - 10}`;
    return `serial${porta}`;
}

/* Posição da porta na sequência de MACs do equipamento. */
function macPosicao(modelo, porta) {
    // CCR2004-16G-2S+: sfp1 (porta 17) e sfp2 (porta 18) têm a ordem de MAC invertida
    if (modelo === 'CCR2004-16G-2S+' && porta === 17) return 18;
    if (modelo === 'CCR2004-16G-2S+' && porta === 18) return 17;
    return porta;
}

function macNormalizar(valor) {
    const hex = valor.trim().replace(/[^0-9a-fA-F]/g, '');
    if (hex.length !== 12) return null;
    return BigInt('0x' + hex);
}

function macFormatar(n, formato) {
    if (n < 0n || n > 0xFFFFFFFFFFFFn) return null;
    const h = n.toString(16).toUpperCase().padStart(12, '0');
    if (formato === 'colon') return h.match(/../g).join(':');
    if (formato === 'dash') return h.match(/../g).join('-');
    if (formato === 'dot') return h.match(/.{4}/g).join('.');
    return h;
}

function macTextoCopia() {
    return macGerados.map((e) => `Porta ${e.porta} / ${e.interface} (${macTipoLabel(e.tipo)}): ${e.mac}`).join('\n');
}

function macMostrarCopiado() {
    const msg = document.getElementById('mac-copiado');
    if (msg) {
        msg.style.display = 'block';
        setTimeout(() => {
            msg.style.display = 'none';
        }, 1800);
    }
}

// --- POPULAÇÃO DOS SELECTS ---

function macPopularPortas() {
    const modelo = document.getElementById('mac-modelo').value;
    const m = MAC_MODELOS[modelo];
    const select = document.getElementById('mac-porta');
    select.innerHTML = '';
    for (let p = 1; p <= m.total; p++) {
        const opt = document.createElement('option');
        opt.value = String(p);
        opt.textContent = `Porta ${p} — ${macInterfaceLabel(modelo, p, m.tipos[p - 1])}`;
        select.appendChild(opt);
    }
    document.getElementById('mac-modelo-hint').textContent = `${m.total} portas · ${m.total} MACs`;
    document.getElementById('mac-out-modelo').value = modelo;
    document.getElementById('mac-out-portas').value = m.total;
}

/* Volta o painel de resultado ao estado vazio. */
function macEsconderResultado() {
    macGerados = [];
    document.getElementById('mac-resultado-wrap').classList.add('hidden');
    document.getElementById('mac-erro-msg').classList.add('hidden');
    document.getElementById('mac-vazio').classList.remove('hidden');
    document.getElementById('mac-out-gerados').value = '—';
    document.getElementById('mac-tabela-body').innerHTML = '';
}

export function initMac() {
    const modeloSelect = document.getElementById('mac-modelo');
    if (!modeloSelect) return;

    if (!modeloSelect.dataset.populado) {
        modeloSelect.innerHTML = Object.keys(MAC_MODELOS)
            .map((nome) => `<option value="${nome}">${nome.replace('/', ' / ')}</option>`)
            .join('');
        modeloSelect.value = MAC_MODELO_PADRAO;
        modeloSelect.dataset.populado = '1';
    }
    macPopularPortas();

    modeloSelect.addEventListener('change', () => {
        macPopularPortas();
        macEsconderResultado();
    });

    document.getElementById('mac-endereco')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') macGerar();
    });

    // Delegação para os botões "Copiar" de cada linha (criados dinamicamente)
    document.getElementById('mac-tabela-body')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-mac]');
        if (!btn) return;
        navigator.clipboard.writeText(btn.dataset.mac);
        macMostrarCopiado();
    });
}

// --- FUNÇÕES EXPORTADAS ---

export function macGerar() {
    const erroMsg = document.getElementById('mac-erro-msg');
    const vazio = document.getElementById('mac-vazio');
    const resultadoWrap = document.getElementById('mac-resultado-wrap');

    function mostrarErro(msg) {
        macEsconderResultado();
        vazio.classList.add('hidden');
        erroMsg.textContent = `⚠ ${msg}`;
        erroMsg.classList.remove('hidden');
    }

    const base = macNormalizar(document.getElementById('mac-endereco').value);
    if (base === null) {
        mostrarErro('Informe um MAC válido com 12 dígitos hexadecimais, ex: AA:BB:CC:DD:EE:FF.');
        return;
    }

    const modelo = document.getElementById('mac-modelo').value;
    const m = MAC_MODELOS[modelo];
    const ref = Number(document.getElementById('mac-porta').value);
    const formato = document.getElementById('mac-formato').value;

    const entradas = [];
    for (let p = 1; p <= m.total; p++) {
        const valor = base + BigInt(macPosicao(modelo, p) - macPosicao(modelo, ref));
        const mac = macFormatar(valor, formato);
        if (mac === null) {
            mostrarErro(`A sequência da porta ${p} ultrapassaria o limite de um endereço MAC de 48 bits. Confira o MAC de referência e a porta selecionada.`);
            return;
        }
        entradas.push({ porta: p, interface: macInterfaceLabel(modelo, p, m.tipos[p - 1]), tipo: m.tipos[p - 1], mac });
    }
    macGerados = entradas;

    document.getElementById('mac-out-gerados').value = entradas.length;

    document.getElementById('mac-tabela-body').innerHTML = entradas.map((e) => `
        <tr${e.porta === ref ? ' class="mac-ref"' : ''}>
            <td>${e.porta}</td>
            <td class="mac-mono">${e.interface}</td>
            <td><span class="mac-tipo mac-tipo-${e.tipo}">${macTipoLabel(e.tipo)}</span></td>
            <td class="mac-mono">${e.mac}</td>
            <td><button class="btn btn-secondary mac-copiar-linha" data-mac="${e.mac}">Copiar</button></td>
        </tr>
    `).join('');

    erroMsg.classList.add('hidden');
    vazio.classList.add('hidden');
    resultadoWrap.classList.remove('hidden');
}

export function macCopiar() {
    if (!macGerados.length) {
        alert('Gere os MACs primeiro!');
        return;
    }
    navigator.clipboard.writeText(macTextoCopia());
    macMostrarCopiado();
}

export function macExportarCsv() {
    if (!macGerados.length) {
        alert('Gere os MACs primeiro!');
        return;
    }
    const csv = 'Porta;Interface;Tipo;MAC\r\n' + macGerados
        .map((e) => `${e.porta};${e.interface};${macTipoLabel(e.tipo)};${e.mac}`)
        .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macs-${document.getElementById('mac-modelo').value.replace(/[^a-z0-9]/gi, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function macLimpar() {
    document.getElementById('mac-endereco').value = '';
    document.getElementById('mac-modelo').value = MAC_MODELO_PADRAO;
    document.getElementById('mac-formato').value = 'colon';
    macPopularPortas();
    macEsconderResultado();

    const msg = document.getElementById('mac-copiado');
    if (msg) msg.style.display = 'none';
}
