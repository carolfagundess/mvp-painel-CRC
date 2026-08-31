// --- CONFIGURAÇÃO DOS EVENTOS ---
const VPLS_EVENTOS = {
    '01': { vlansTagged: [20, 30, 40, 50, 60], vlanPrincipal: 70, vlanCabeada: 80 },
    '02': { vlansTagged: [22, 32, 42, 52, 62], vlanPrincipal: 72, vlanCabeada: 82 },
    '03': { vlansTagged: [23, 33, 43, 53, 63], vlanPrincipal: 73, vlanCabeada: 83 },
};

const VPLS_PORTAS_BASE = ['ether2', 'ether3', 'ether4', 'ether5'];
const VPLS_PORTAS_OPCOES = ['ether2', 'ether3', 'ether4', 'ether5', 'ether6', 'ether7', 'ether8', 'ether9', 'ether10'];

function vplsNormalizarPorta(porta) {
    return (porta || '').trim().toLowerCase();
}

function vplsObterPortasCabeadas() {
    const portas = [...document.querySelectorAll('#vpls-portsContainer .lan-port')]
        .map((s) => vplsNormalizarPorta(s.value))
        .filter(Boolean);
    return [...new Set(portas)];
}

function vplsOptionsPortas() {
    return `<option value="">SELECIONE A PORTA</option>${VPLS_PORTAS_OPCOES.map((p) => `<option value="${p}">${p}</option>`).join('')}`;
}

export function vplsAdicionarPorta() {
    const container = document.getElementById('vpls-portsContainer');
    const row = document.createElement('div');
    row.className = 'porta-linha';
    row.innerHTML = `
<select class="lan-port">${vplsOptionsPortas()}</select>
<button type="button" class="btn btn-danger btn-remove-porta">Remover</button>`;
    container.appendChild(row);
    row.querySelector('.lan-port').addEventListener('change', vplsAtualizarPreview);
    row.querySelector('.btn-remove-porta').addEventListener('click', () => vplsRemoverPorta(row));
    vplsAtualizarPreview();
}

export function vplsRemoverPorta(row) {
    const linhas = document.querySelectorAll('#vpls-portsContainer .porta-linha');
    if (linhas.length <= 1) {
        row.querySelector('.lan-port').value = '';
        vplsAtualizarPreview();
        return;
    }
    row.remove();
    vplsAtualizarPreview();
}

export function vplsToggleRedeCabeada() {
    const redeCabeada = document.getElementById('vpls-redeCabeada').value;
    const tipoBox = document.getElementById('vpls-tipoRedeCabeadaBox');
    const portasBox = document.getElementById('vpls-cabledConfig');

    if (redeCabeada === 'sim') {
        tipoBox.classList.remove('hidden');
        vplsToggleTipoRedeCabeada();
    } else {
        tipoBox.classList.add('hidden');
        portasBox.classList.add('hidden');
    }
    vplsAtualizarPreview();
}

export function vplsToggleTipoRedeCabeada() {
    const redeCabeada = document.getElementById('vpls-redeCabeada').value;
    const tipoRedeCabeada = document.getElementById('vpls-tipoRedeCabeada').value;
    const portasBox = document.getElementById('vpls-cabledConfig');

    if (redeCabeada === 'sim' && tipoRedeCabeada === 'mikrotik') {
        portasBox.classList.remove('hidden');
    } else {
        portasBox.classList.add('hidden');
    }
    vplsAtualizarPreview();
}

export function vplsAtualizarPreview() {
    const vpls = parseInt(document.getElementById('vpls-vpls').value, 10) || 1;
    const evento = document.getElementById('vpls-evento').value;
    const redeCabeada = document.getElementById('vpls-redeCabeada').value;
    const tipoRedeCabeada = document.getElementById('vpls-tipoRedeCabeada').value;
    const configEvento = VPLS_EVENTOS[evento];

    let vlansPreview = [...configEvento.vlansTagged];
    if (redeCabeada === 'sim' && tipoRedeCabeada === 'switch') {
        vlansPreview.push(configEvento.vlanCabeada);
    }

    let portasPreview = [...VPLS_PORTAS_BASE];
    if (redeCabeada === 'sim' && tipoRedeCabeada === 'mikrotik') {
        const portasCabeadas = vplsObterPortasCabeadas();
        portasPreview = VPLS_PORTAS_BASE.filter((p) => !portasCabeadas.includes(p));
    }

    document.getElementById('vpls-previewEvento').textContent = evento;
    document.getElementById('vpls-previewVpls').textContent = `${vpls}:0`;
    document.getElementById('vpls-previewIp').textContent = `172.20.0.${vpls}/24`;
    document.getElementById('vpls-previewVlanPrincipal').textContent = configEvento.vlanPrincipal;
    document.getElementById('vpls-previewVlanUntagged').textContent = configEvento.vlanPrincipal;
    document.getElementById('vpls-previewPortasPrincipais').textContent = portasPreview.length > 0 ? portasPreview.join(', ') : 'NENHUMA';
    document.getElementById('vpls-previewVlansTagged').textContent = vlansPreview.join(', ');
    document.getElementById('vpls-previewRedeCabeada').textContent = configEvento.vlanCabeada;
    document.getElementById('vpls-textoVlanCabeada').textContent = `VLAN ${configEvento.vlanCabeada}`;

    const previewTipoRedeBox = document.getElementById('vpls-previewTipoRedeBox');
    const previewVlanCabeadaBox = document.getElementById('vpls-previewVlanCabeadaBox');

    if (redeCabeada === 'nao') {
        document.getElementById('vpls-previewRedeCabeadaStatus').textContent = 'NÃO';
        previewTipoRedeBox.classList.add('hidden');
        previewVlanCabeadaBox.classList.add('hidden');
    } else {
        document.getElementById('vpls-previewRedeCabeadaStatus').textContent = 'SIM';
        previewTipoRedeBox.classList.remove('hidden');
        previewVlanCabeadaBox.classList.remove('hidden');
        document.getElementById('vpls-previewTipoRedeCabeada').textContent =
            tipoRedeCabeada === 'mikrotik' ? 'DIRETO NO MIKROTIK' : 'DEPOIS DO SWITCH';
    }
}

export function vplsGerar() {
    const vpls = parseInt(document.getElementById('vpls-vpls').value, 10);
    const interface3025 = document.getElementById('vpls-interface3025').value.trim();
    const evento = document.getElementById('vpls-evento').value;
    const redeCabeada = document.getElementById('vpls-redeCabeada').value;
    const tipoRedeCabeada = document.getElementById('vpls-tipoRedeCabeada').value;
    const configEvento = VPLS_EVENTOS[evento];
    const { vlansTagged, vlanPrincipal, vlanCabeada } = configEvento;

    if (!vpls || vpls < 1 || vpls > 254) {
        alert('Informe uma VPLS válida entre 1 e 254.');
        return;
    }
    if (!interface3025) {
        alert('Informe a interface que será adicionada à VLAN 3025.');
        return;
    }

    const ip = `172.20.0.${vpls}`;
    const ipCidr = `${ip}/24`;
    const vplsId = `${vpls}:0`;
    const peer = '172.20.0.254';

    let portasCabeadas = [];
    if (redeCabeada === 'sim' && tipoRedeCabeada === 'mikrotik') {
        portasCabeadas = vplsObterPortasCabeadas();
        if (portasCabeadas.length === 0) {
            alert('Selecione pelo menos uma porta para a rede cabeada.');
            return;
        }
    }

    let portasPadraoDisponiveis = [...VPLS_PORTAS_BASE];
    if (redeCabeada === 'sim' && tipoRedeCabeada === 'mikrotik') {
        portasPadraoDisponiveis = VPLS_PORTAS_BASE.filter((p) => !portasCabeadas.includes(p));
    }

    let vlansTaggedFinal = [...vlansTagged];
    if (redeCabeada === 'sim' && tipoRedeCabeada === 'switch') {
        vlansTaggedFinal.push(vlanCabeada);
    }

    let bridgePorts = '';
    portasPadraoDisponiveis.forEach((porta) => {
        bridgePorts += `add bridge=BRIDGE-LAN interface=${porta} pvid=${vlanPrincipal}\n`;
    });

    if (redeCabeada === 'sim' && tipoRedeCabeada === 'mikrotik') {
        portasCabeadas.forEach((porta) => {
            bridgePorts += `add bridge=BRIDGE-LAN interface=${porta} pvid=${vlanCabeada}\n`;
        });
    }

    let bridgeVlan = '';
    const portasPrincipais = portasPadraoDisponiveis.join(',');

    bridgeVlan += portasPrincipais
        ? `add bridge=BRIDGE-LAN tagged=VPLS-Concentrador-TI untagged=${portasPrincipais} vlan-ids=${vlanPrincipal}\n`
        : `add bridge=BRIDGE-LAN tagged=VPLS-Concentrador-TI vlan-ids=${vlanPrincipal}\n`;

    bridgeVlan += portasPrincipais
        ? `add bridge=BRIDGE-LAN tagged=VPLS-Concentrador-TI,${portasPrincipais} vlan-ids=${vlansTaggedFinal.join(',')}\n`
        : `add bridge=BRIDGE-LAN tagged=VPLS-Concentrador-TI vlan-ids=${vlansTaggedFinal.join(',')}\n`;

    if (redeCabeada === 'sim' && tipoRedeCabeada === 'mikrotik' && portasCabeadas.length > 0) {
        bridgeVlan += `add bridge=BRIDGE-LAN tagged=VPLS-Concentrador-TI untagged=${portasCabeadas.join(',')} vlan-ids=${vlanCabeada}\n`;
    }

    const script = `/interface bridge
add name=BRIDGE-LAN protocol-mode=none vlan-filtering=yes

/interface vpls
add arp=enabled disabled=no mtu=1500 name=VPLS-Concentrador-TI peer=${peer} pw-l2mtu=1544 vpls-id=${vplsId}

/interface vlan
add interface=${interface3025} name=vlan3025 vlan-id=3025

/mpls traffic-eng path
add disabled=no name=tp1 use-cspf=no

/interface bridge port
add bridge=BRIDGE-LAN interface=VPLS-Concentrador-TI
${bridgePorts}
/interface bridge vlan
${bridgeVlan}
/ip address
add address=${ipCidr} interface=vlan3025 network=172.20.0.0

/mpls interface
add disabled=no interface=vlan3025 mpls-mtu=1544

/mpls ldp
add disabled=no lsr-id=${ip} transport-addresses=${ip}

/mpls ldp interface
add disabled=no interface=vlan3025 transport-addresses=${ip}

/mpls traffic-eng interface
add bandwidth=10Gbps blockade-k-factor=3 disabled=no down-flood-thresholds=15,30,45,60,75,80,85,90,95,97,98,99,100 igp-flood-period=3m interface=vlan3025 k-factor=3 refresh-time=30s resource-class=0 te-metric=1 up-flood-thresholds=15,30,45,60,75,80,85,90,95,97,98,99,100 use-udp=no

/mpls traffic-eng tunnel
add auto-bandwidth-reserve=105% bandwidth=1Gbps bandwidth-limit=100% disabled=no name=tunnel1 primary-path=tp1 to-address=${peer}
`;

    const resultado = document.getElementById('vpls-resultado');
    resultado.style.display = 'block';
    resultado.textContent = script;

    let mensagem = `EVENTO ${evento} - VPLS ${vpls} - IP ${ip}`;
    if (redeCabeada === 'sim' && tipoRedeCabeada === 'mikrotik') {
        mensagem += ` - VLAN ${vlanCabeada} ACCESS: ${portasCabeadas.join(', ')}`;
        const portasMovidas = portasCabeadas.filter((p) => VPLS_PORTAS_BASE.includes(p));
        if (portasMovidas.length > 0) {
            mensagem += ` - Retiradas da VLAN ${vlanPrincipal}: ${portasMovidas.join(', ')}`;
        }
    }
    if (redeCabeada === 'sim' && tipoRedeCabeada === 'switch') {
        mensagem += ` - VLAN ${vlanCabeada} TAGGED PARA O SWITCH`;
    }
    document.getElementById('vpls-status').textContent = mensagem;
}

export function vplsCopiar() {
    const resultado = document.getElementById('vpls-resultado');
    if (!resultado.textContent.trim() || resultado.textContent === '—') {
        alert('Gere o script primeiro.');
        return;
    }
    navigator.clipboard.writeText(resultado.textContent);
    const m = document.getElementById('vpls-copiado');
    m.style.display = 'block';
    setTimeout(() => {
        m.style.display = 'none';
    }, 1800);
}

export function vplsLimpar() {
    document.getElementById('vpls-evento').selectedIndex = 0;
    document.getElementById('vpls-vpls').value = '1';
    document.getElementById('vpls-interface3025').value = 'ether1';
    document.getElementById('vpls-redeCabeada').selectedIndex = 0;
    document.getElementById('vpls-tipoRedeCabeada').selectedIndex = 0;

    const container = document.getElementById('vpls-portsContainer');
    container.querySelectorAll('.porta-linha').forEach((row, i) => {
        if (i > 0) row.remove();
    });
    const primeira = container.querySelector('.lan-port');
    if (primeira) primeira.value = '';

    document.getElementById('vpls-resultado').style.display = 'none';
    document.getElementById('vpls-resultado').textContent = '—';
    document.getElementById('vpls-status').textContent = '';
    document.getElementById('vpls-copiado').style.display = 'none';

    vplsToggleRedeCabeada();
    vplsAtualizarPreview();
}

export function initVplsEvento() {
    const eventoSelect = document.getElementById('vpls-evento');
    const vplsInput = document.getElementById('vpls-vpls');
    if (!eventoSelect || !vplsInput) return;

    eventoSelect.addEventListener('change', vplsAtualizarPreview);
    vplsInput.addEventListener('input', vplsAtualizarPreview);
    document.getElementById('vpls-redeCabeada').addEventListener('change', vplsToggleRedeCabeada);
    document.getElementById('vpls-tipoRedeCabeada').addEventListener('change', vplsToggleTipoRedeCabeada);
    document.getElementById('vpls-add-porta').addEventListener('click', vplsAdicionarPorta);

    document.querySelectorAll('#vpls-portsContainer .lan-port').forEach((sel) => {
        sel.addEventListener('change', vplsAtualizarPreview);
    });
    document.querySelectorAll('#vpls-portsContainer .btn-remove-porta').forEach((btn) => {
        btn.addEventListener('click', () => vplsRemoverPorta(btn.closest('.porta-linha')));
    });

    vplsToggleRedeCabeada();
    vplsAtualizarPreview();
}
