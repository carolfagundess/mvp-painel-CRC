const MAX_SUBREDES_EXIBIDAS = 256;

// --- FUNÇÕES PURAS DE APOIO ---

function validarFormatoIP(ip) {
    const octetos = ip.split('.');
    if (octetos.length !== 4) return false;
    return octetos.every((o) => /^\d{1,3}$/.test(o) && Number(o) >= 0 && Number(o) <= 255);
}

function ipParaInt(ip) {
    return ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

function intParaIp(n) {
    return [24, 16, 8, 0].map((shift) => (n >>> shift) & 255).join('.');
}

function cidrParaMascaraInt(cidr) {
    return cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
}

function wildcardParaCidr(cidr) {
    return cidr === 0 ? 0xFFFFFFFF : (~cidrParaMascaraInt(cidr)) >>> 0;
}

function obterClasse(ipInt) {
    const primeiroOcteto = (ipInt >>> 24) & 255;
    if (primeiroOcteto < 128) return 'A';
    if (primeiroOcteto < 192) return 'B';
    if (primeiroOcteto < 224) return 'C';
    if (primeiroOcteto < 240) return 'D (Multicast)';
    return 'E (Experimental)';
}

function obterTipoEspecial(ipInt) {
    const emFaixa = (baseIp, cidr) => (ipInt & cidrParaMascaraInt(cidr)) === (ipParaInt(baseIp) & cidrParaMascaraInt(cidr));
    if (emFaixa('127.0.0.0', 8)) return 'loopback';
    if (emFaixa('169.254.0.0', 16)) return 'link-local';
    if (emFaixa('10.0.0.0', 8) || emFaixa('172.16.0.0', 12) || emFaixa('192.168.0.0', 16)) return 'privado (RFC 1918)';
    if (emFaixa('224.0.0.0', 4)) return 'multicast';
    return null;
}

function bitsParaSubRedes(n) {
    return n <= 1 ? 0 : Math.ceil(Math.log2(n));
}

function bitsParaHosts(n) {
    let h = 0;
    while (Math.pow(2, h) - 2 < n) h++;
    return h;
}

function calcularFaixaHost(redeInt, broadcastInt, cidr) {
    if (cidr >= 31) {
        return { primeiro: intParaIp(redeInt), ultimo: intParaIp(broadcastInt) };
    }
    return { primeiro: intParaIp(redeInt + 1), ultimo: intParaIp(broadcastInt - 1) };
}

function gerarSubRedes(parentRedeInt, parentCidr, novoCidr) {
    const totalSubRedes = Math.pow(2, novoCidr - parentCidr);
    const tamanhoSubRede = Math.pow(2, 32 - novoCidr);
    const limite = Math.min(totalSubRedes, MAX_SUBREDES_EXIBIDAS);

    const subRedes = [];
    for (let i = 0; i < limite; i++) {
        const redeInt = (parentRedeInt + i * tamanhoSubRede) >>> 0;
        const wildcardInt = wildcardParaCidr(novoCidr);
        const broadcastInt = (redeInt | wildcardInt) >>> 0;
        const faixa = calcularFaixaHost(redeInt, broadcastInt, novoCidr);
        subRedes.push({
            id: i + 1,
            rede: intParaIp(redeInt),
            broadcast: novoCidr >= 31 ? null : intParaIp(broadcastInt),
            primeiroHost: faixa.primeiro,
            ultimoHost: faixa.ultimo
        });
    }
    return { subRedes, totalSubRedes };
}

function gerarTextoCopia(dados) {
    const linhas = [];
    linhas.push(`Rede: ${dados.cidrTexto}`);
    linhas.push(`Intervalo de Endereço de Host: ${dados.hostRange}`);
    linhas.push(`Endereço de Difusão: ${dados.broadcast}`);
    linhas.push(`Máscara Curinga: ${dados.wildcard}`);
    linhas.push(`Notação CIDR: ${dados.cidrTexto}`);
    linhas.push(`Classe ${dados.classe}${dados.tipoEspecial ? ` · Endereço ${dados.tipoEspecial}` : ''}`);
    linhas.push('');
    const sufixoExibicao = dados.subRedes.length < dados.totalSubRedes ? `, exibindo ${dados.subRedes.length}` : '';
    linhas.push(`Sub-redes (/${dados.novoCidr}) - ${dados.totalSubRedes} no total${sufixoExibicao}:`);
    dados.subRedes.forEach((s) => {
        linhas.push(`  #${s.id}  ${s.rede}/${dados.novoCidr}  Host: ${s.primeiroHost}-${s.ultimoHost}  Broadcast: ${s.broadcast ?? 'N/A'}`);
    });
    return linhas.join('\n');
}

// --- POPULAÇÃO DO SELECT DE MÁSCARA ---

function popularSelectMascara(select) {
    for (let cidr = 0; cidr <= 32; cidr++) {
        const opt = document.createElement('option');
        opt.value = String(cidr);
        opt.textContent = `${intParaIp(cidrParaMascaraInt(cidr))} /${cidr}`;
        select.appendChild(opt);
    }
    select.value = '24';
}

export function initIpv4() {
    const select = document.getElementById('ipv4-mascara');
    if (select && !select.dataset.populado) {
        popularSelectMascara(select);
        select.dataset.populado = '1';
    }
}

// --- FUNÇÕES EXPORTADAS ---

export function ipv4Calcular() {
    const ipInput = document.getElementById('ipv4-ip');
    const mascaraSelect = document.getElementById('ipv4-mascara');
    const numSubRedesInput = document.getElementById('ipv4-num-subredes');
    const numHostsInput = document.getElementById('ipv4-num-hosts');

    const erroWrap = document.getElementById('ipv4-erro-wrap');
    const erroMsg = document.getElementById('ipv4-erro-msg');
    const resultadoWrap = document.getElementById('ipv4-resultado-wrap');

    if (!ipInput || !mascaraSelect || !erroWrap || !resultadoWrap) return;

    function mostrarErro(msg) {
        erroMsg.textContent = `⚠ ${msg}`;
        erroWrap.classList.remove('hidden');
        resultadoWrap.classList.add('hidden');
        delete resultadoWrap.dataset.textoCopia;
    }

    const ipStr = (ipInput.value || '').trim();
    if (!validarFormatoIP(ipStr)) {
        mostrarErro('Informe um endereço IP válido, ex: 10.0.0.0.');
        return;
    }

    const parentCidr = parseInt(mascaraSelect.value, 10);
    const numSubRedesDesejado = parseInt(numSubRedesInput.value, 10) || 0;
    const numHostsDesejado = parseInt(numHostsInput.value, 10) || 0;

    let novoCidr = parentCidr;
    if (numHostsDesejado > 0) {
        novoCidr = 32 - bitsParaHosts(numHostsDesejado);
    } else if (numSubRedesDesejado > 0) {
        novoCidr = parentCidr + bitsParaSubRedes(numSubRedesDesejado);
    }

    if (novoCidr < parentCidr) {
        mostrarErro('Não é possível atender a quantidade de hosts solicitada dentro dessa máscara de rede.');
        return;
    }
    if (novoCidr > 32) {
        mostrarErro('Não há endereços suficientes para essa divisão de sub-redes.');
        return;
    }

    const ipInt = ipParaInt(ipStr);
    const parentMascaraInt = cidrParaMascaraInt(parentCidr);
    const parentRedeInt = (ipInt & parentMascaraInt) >>> 0;
    const parentWildcardInt = wildcardParaCidr(parentCidr);
    const parentBroadcastInt = (parentRedeInt | parentWildcardInt) >>> 0;
    const faixaParent = calcularFaixaHost(parentRedeInt, parentBroadcastInt, parentCidr);

    const hostRange = `${faixaParent.primeiro} - ${faixaParent.ultimo}`;
    const broadcast = parentCidr >= 31 ? 'N/A' : intParaIp(parentBroadcastInt);
    const wildcard = intParaIp(parentWildcardInt);
    const cidrTexto = `${intParaIp(parentRedeInt)}/${parentCidr}`;
    const classe = obterClasse(ipInt);
    const tipoEspecial = obterTipoEspecial(ipInt);

    document.getElementById('ipv4-out-hostrange').value = hostRange;
    document.getElementById('ipv4-out-broadcast').value = broadcast;
    document.getElementById('ipv4-out-wildcard').value = wildcard;
    document.getElementById('ipv4-out-cidr').value = cidrTexto;
    document.getElementById('ipv4-out-extra').textContent = `Classe ${classe}${tipoEspecial ? ` · Endereço ${tipoEspecial}` : ''}`;

    const { subRedes, totalSubRedes } = gerarSubRedes(parentRedeInt, parentCidr, novoCidr);
    const tbody = document.getElementById('ipv4-tabela-body');
    tbody.innerHTML = subRedes.map((s) => `
        <tr>
            <td>${s.id}</td>
            <td>${s.rede}/${novoCidr}</td>
            <td>${s.primeiroHost} - ${s.ultimoHost}</td>
            <td>${s.broadcast ?? 'N/A'}</td>
        </tr>
    `).join('');

    const aviso = document.getElementById('ipv4-tabela-aviso');
    if (subRedes.length < totalSubRedes) {
        aviso.textContent = `⚠ Mostrando as primeiras ${subRedes.length} de ${totalSubRedes} sub-redes.`;
        aviso.classList.remove('hidden');
    } else {
        aviso.classList.add('hidden');
    }

    erroWrap.classList.add('hidden');
    resultadoWrap.classList.remove('hidden');

    resultadoWrap.dataset.textoCopia = gerarTextoCopia({
        cidrTexto, hostRange, broadcast, wildcard, classe, tipoEspecial, novoCidr, subRedes, totalSubRedes
    });
}

export function ipv4Copiar() {
    const resultadoWrap = document.getElementById('ipv4-resultado-wrap');
    const texto = resultadoWrap ? resultadoWrap.dataset.textoCopia : null;
    if (!texto) {
        alert('Calcule a sub-rede primeiro!');
        return;
    }
    navigator.clipboard.writeText(texto);
    const msg = document.getElementById('ipv4-copiado');
    if (msg) {
        msg.style.display = 'block';
        setTimeout(() => {
            msg.style.display = 'none';
        }, 1800);
    }
}

export function ipv4Limpar() {
    const ipInput = document.getElementById('ipv4-ip');
    if (ipInput) ipInput.value = '';

    const mascaraSelect = document.getElementById('ipv4-mascara');
    if (mascaraSelect) mascaraSelect.value = '24';

    const numSubRedesInput = document.getElementById('ipv4-num-subredes');
    if (numSubRedesInput) numSubRedesInput.value = '';

    const numHostsInput = document.getElementById('ipv4-num-hosts');
    if (numHostsInput) numHostsInput.value = '';

    const resultadoWrap = document.getElementById('ipv4-resultado-wrap');
    if (resultadoWrap) {
        resultadoWrap.classList.add('hidden');
        delete resultadoWrap.dataset.textoCopia;
    }

    const tbody = document.getElementById('ipv4-tabela-body');
    if (tbody) tbody.innerHTML = '';

    const erroWrap = document.getElementById('ipv4-erro-wrap');
    if (erroWrap) erroWrap.classList.add('hidden');

    const msg = document.getElementById('ipv4-copiado');
    if (msg) msg.style.display = 'none';
}