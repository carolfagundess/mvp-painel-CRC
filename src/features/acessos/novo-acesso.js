export function novoToggleTipo() {
    const modelo = document.getElementById('novo-modelo').value;
    const tipo = document.getElementById('novo-tipo').value;

    // Local (Apenas Interconexão)
    document.getElementById('novo-campoLocal').classList.toggle('hidden', modelo !== 'interconexao');

    // Tipo (GPON vs PTP)
    document.getElementById('bloco-gpon-sn').classList.toggle('hidden', tipo !== 'GPON');
    document.getElementById('bloco-ptp-sw').classList.toggle('hidden', tipo !== 'PTP');

    // Plano (Dedicado vs Banda Larga)
    document.getElementById('bloco-dedicado-ips').classList.toggle('hidden', modelo !== 'dedicado');
    document.getElementById('bloco-bandalarga-ip').classList.toggle('hidden', modelo !== 'banda-larga');
}

export function novoGerar() {
    const modelo = document.getElementById('novo-modelo').value;
    const tipo = document.getElementById('novo-tipo').value;
    const cidade = document.getElementById('novo-cidade').value.trim().toUpperCase();
    const cliente = document.getElementById('novo-cliente').value.trim();
    const circuito = document.getElementById('novo-circuito').value.trim();
    const nomeRaw = document.getElementById('novo-nome').value.trim().toUpperCase();
    const nome = nomeRaw.normalize ? nomeRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : nomeRaw;
    const nomeClean = nome.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '_');

    if (!cidade || !cliente || !circuito || !nomeClean) {
        alert('Preencha todos os campos do cliente (Cidade, Código, Circuito e Nome)!');
        return;
    }

    // IDENTITY
    const local = modelo === 'interconexao' ? document.getElementById('novo-local').value : null;
    const identity = modelo === 'interconexao'
        ? `CUST-RB-${tipo}-${local}-${cidade}-${cliente}-${circuito}-${nomeClean}`
        : `CUST-RB-${tipo}-${cidade}-${cliente}-${circuito}-${nomeClean}`;

    // CAMPOS DE OBSERVAÇÃO
    const mac = document.getElementById('novo-mac')?.value.trim().toUpperCase() || '';
    const sn = document.getElementById('novo-sn')?.value.trim().toUpperCase() || '';
    const swLocal = document.getElementById('novo-sw-local')?.value.trim().toUpperCase() || '';
    const swRemoto = document.getElementById('novo-sw-remoto')?.value.trim().toUpperCase() || '';
    const ipPtpDed = document.getElementById('novo-ptp-dedicado')?.value.trim() || '';
    const ipRedeDed = document.getElementById('novo-rede-dedicado')?.value.trim() || '';
    const ipFixado = document.getElementById('novo-ip-fixado')?.value.trim() || '';

    // LÓGICA DE MONTAGEM DA OBSERVAÇÃO
    const obsParts = [];

    // Sempre tem MAC
    if (mac) obsParts.push(`MAC: ${mac}`);

    // Tipo
    if (tipo === 'GPON' && sn) obsParts.push(`SN: ${sn}`);
    if (tipo === 'PTP') {
        if (swLocal) obsParts.push(`SW: ${swLocal}`);
        if (swRemoto) obsParts.push(`SW Remoto: ${swRemoto}`);
    }

    // Plano
    if (modelo === 'dedicado') {
        if (ipPtpDed) obsParts.push(`PTP: ${ipPtpDed}`);
        if (ipRedeDed) obsParts.push(`Rede: ${ipRedeDed}`);
    }
    if (modelo === 'banda-larga' && ipFixado) {
        obsParts.push(`IP Fixado: ${ipFixado}`);
    }

    const obsStr = obsParts.join(' | ');

    // LÓGICA DO SCRIPT MIKROTIK
    let combined = `--- IDENTITY ---\n/system identity set name=\"${identity}\"\n\n`;

    if (document.getElementById('novo-includeRadius').checked) {
        const radiusScript = `/ip service set [find ] address=187.85.161.248/29,189.45.192.0/26,177.54.10.0/29,189.90.48.131/32 disabled=no\n/ip service set ftp,telnet,api,api-ssl disabled=yes\n/radius remove [find ]\n/radius add address=187.85.161.130 secret=99hxSGKae service=login\n/radius incoming set accept=no\n/user aaa\nset default-group=read use-radius=yes\n/user group add name=N1-Suporte policy=[/user group get value-name=policy number=[find name=full ]]\n/system logging\nset 0,1,2,3 action=disk\n/system logging action set 3 remote=187.85.161.130 remote-port=8514\n/system logging remove [find default=no]\n/system logging add action=remote topics=critical\n/system logging add action=remote topics=error,!ipsec\n/system logging add action=remote topics=info,!dhcp,!firewall\n/system logging add action=remote topics=warning,!dhcp\n/ip dns\nset servers=189.45.192.3,177.200.200.20`;
        combined += `--- RADIUS E SERVICOS ---\n${radiusScript}\n\n`;
    }

    if (document.getElementById('novo-includeNtp').checked) {
        const v = document.getElementById('novo-ntp-versao').value;
        let ntpScript = '';
        if (v === 'v6') {
            ntpScript = `/system clock\nset time-zone-name=America/Sao_Paulo\n/system ntp client\nset enabled=yes primary-ntp=189.45.192.3`;
        } else {
            ntpScript = `/system clock\nset time-zone-name=America/Sao_Paulo\n/system ntp client\nset enabled=yes\n/system ntp client servers\nadd address=189.45.192.3\nadd address=177.200.200.20`;
        }
        combined += `--- NTP (${v}) ---\n${ntpScript}\n\n`;
    }

    const resultBox = document.getElementById('novo-id-resultado');
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.textContent = combined;
    }

    const obsBox = document.getElementById('novo-obs-resultado');
    if (obsBox) {
        if (obsStr !== '') {
            obsBox.style.display = 'block';
            obsBox.textContent = `OBS: ${obsStr}`;
        } else {
            obsBox.style.display = 'none';
            obsBox.textContent = '—';
        }
    }
}

export function novoGerarSoRadius() {
    const radiusScript = `/ip service set [find ] address=187.85.161.248/29,189.45.192.0/26,177.54.10.0/29,189.90.48.131/32 disabled=no\n/ip service set ftp,telnet,api,api-ssl disabled=yes\n/radius remove [find ]\n/radius add address=187.85.161.130 secret=99hxSGKae service=login\n/radius incoming set accept=no\n/user aaa\nset default-group=read use-radius=yes\n/user group add name=N1-Suporte policy=[/user group get value-name=policy number=[find name=full ]]\n/system logging\nset 0,1,2,3 action=disk\n/system logging action set 3 remote=187.85.161.130 remote-port=8514\n/system logging remove [find default=no]\n/system logging add action=remote topics=critical\n/system logging add action=remote topics=error,!ipsec\n/system logging add action=remote topics=info,!dhcp,!firewall\n/system logging add action=remote topics=warning,!dhcp\n/ip dns\nset servers=189.45.192.3,177.200.200.20`;

    const resultBox = document.getElementById('novo-id-resultado');
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.textContent = `--- RADIUS E SERVICOS ---\n${radiusScript}`;
    }
    const obsBox = document.getElementById('novo-obs-resultado');
    if (obsBox) {
        obsBox.style.display = 'none';
        obsBox.textContent = '—';
    }
}

export function novoGerarSoNtp() {
    const v = document.getElementById('novo-ntp-versao').value;
    let ntpScript = '';
    if (v === 'v6') {
        ntpScript = `/system clock\nset time-zone-name=America/Sao_Paulo\n/system ntp client\nset enabled=yes primary-ntp=189.45.192.3`;
    } else {
        ntpScript = `/system clock\nset time-zone-name=America/Sao_Paulo\n/system ntp client\nset enabled=yes\n/system ntp client servers\nadd address=189.45.192.3\nadd address=177.200.200.20`;
    }

    const resultBox = document.getElementById('novo-id-resultado');
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.textContent = `--- NTP (${v}) ---\n${ntpScript}`;
    }
    const obsBox = document.getElementById('novo-obs-resultado');
    if (obsBox) {
        obsBox.style.display = 'none';
        obsBox.textContent = '—';
    }
}

export function novoCopiar() {
    const obsBox = document.getElementById('novo-obs-resultado');
    const scriptBox = document.getElementById('novo-id-resultado');

    let textoFinal = '';
    if (obsBox && obsBox.style.display !== 'none' && obsBox.textContent !== '—') {
        textoFinal += obsBox.textContent + '\n\n';
    }
    if (scriptBox && scriptBox.style.display !== 'none' && scriptBox.textContent !== '—') {
        textoFinal += scriptBox.textContent;
    }

    if (!textoFinal.trim()) {
        alert('Nada para copiar! Gere o script primeiro.');
        return;
    }

    navigator.clipboard.writeText(textoFinal.trim());

    const msg = document.getElementById('novo-copiado');
    if (msg) {
        msg.style.display = 'block';
        setTimeout(() => {
            msg.style.display = 'none';
        }, 1800);
    }
}

export function novoLimpar() {
    // 1. Limpa todos os campos de texto (incluindo os novos IPs)
    const camposTexto = [
        'novo-cidade', 'novo-cliente', 'novo-circuito', 'novo-nome',
        'novo-mac', 'novo-sn', 'novo-sw-local', 'novo-sw-remoto',
        'novo-ptp-dedicado', 'novo-rede-dedicado', 'novo-ip-fixado'
    ];
    camposTexto.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // 2. Reseta os selects para a nova opção padrão
    document.getElementById('novo-modelo').value = 'banda-larga';
    document.getElementById('novo-tipo').value = 'GPON';
    document.getElementById('novo-local').value = 'FL';
    document.getElementById('novo-ntp-versao').value = 'v6';

    // 3. Reseta os checkboxes para marcados
    document.getElementById('novo-includeRadius').checked = true;
    document.getElementById('novo-includeNtp').checked = true;

    // 4. Restaura a visibilidade padrão dos blocos
    // Como a função novoToggleTipo() já controla tudo agora, basta chamá-la.
    novoToggleTipo();

    // 5. Esconde e limpa as caixas de resultado
    const resId = document.getElementById('novo-id-resultado');
    if (resId) {
        resId.style.display = 'none';
        resId.textContent = '—';
    }

    const resObs = document.getElementById('novo-obs-resultado');
    if (resObs) {
        resObs.style.display = 'none';
        resObs.textContent = '—';
    }
}