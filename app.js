/* ══ NAVEGAÇÃO ══ */
function showPage(id, navEl) {
    // accept either 'novo' or 'page-novo'
    const pageId = (typeof id === 'string' && id.startsWith('page-')) ? id : ('page-' + id);
    const pageEl = document.getElementById(pageId);
    if (!pageEl) { console.warn('showPage: page not found', pageId); return; }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    pageEl.classList.add('active');
    if (navEl && navEl.classList) navEl.classList.add('active');

    // ensure visible at top
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* ignore */ }
}

/* ══ IDENTITY ══ */
function idToggleLocal() {
    const v = document.getElementById('id-modelo').value;
    document.getElementById('id-campoLocal').classList.toggle('hidden', v !== 'interconexao');
}

function idGerar() {
    const modelo = document.getElementById('id-modelo').value;
    const tipo = document.getElementById('id-tipo').value;
    const cidade = document.getElementById('id-cidade').value.trim().toUpperCase();
    const cliente = document.getElementById('id-cliente').value.trim();
    const circuito = document.getElementById('id-circuito').value.trim();
    const nome = document.getElementById('id-nome').value.trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, "_");

    if (!cidade || !cliente || !circuito || !nome) { alert("Preencha todos os campos!"); return; }

    let res = modelo === 'interconexao'
        ? `CUST-RB-${tipo}-${document.getElementById('id-local').value}-${cidade}-${cliente}-${circuito}-${nome}`
        : `CUST-RB-${tipo}-${cidade}-${cliente}-${circuito}-${nome}`;

    document.getElementById('id-resultado').textContent = res;
}

function idCopiar() {
    const t = document.getElementById('id-resultado').textContent;
    if (t === '—') { alert("Nada para copiar!"); return; }
    navigator.clipboard.writeText(t);
    const m = document.getElementById('id-copiado');
    m.style.display = 'block';
    setTimeout(() => m.style.display = 'none', 1800);
}

function idLimpar() {
    ['id-modelo', 'id-tipo', 'id-cidade', 'id-cliente', 'id-circuito', 'id-nome'].forEach(id => {
        const el = document.getElementById(id);
        if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = '';
    });
    document.getElementById('id-resultado').textContent = '—';
    document.getElementById('id-campoLocal').classList.add('hidden');
}

/* ══ CIASC ══ */
const ciascNomes = { 650: 'CAMERAS', 690: 'VOIP', 903: 'GERENCIA', 601: 'SED', 602: 'SSS', 603: 'SSE', 604: 'HOTSPOT', 605: 'SUA', 606: 'INET', 999: 'TRANSIT-DC' };

function ciascTrocar() {
    const t = document.getElementById('ciasc-tipo').value;
    document.getElementById('ciasc-blocoVPLS').classList.add('hidden');
    document.getElementById('ciasc-blocoCadastro').classList.add('hidden');
    document.getElementById('ciasc-btnRow').style.display = 'none';
    document.getElementById('ciasc-resultado').style.display = 'none';
    if (t === 'vpls') document.getElementById('ciasc-blocoVPLS').classList.remove('hidden');
    if (t === 'cadastro') document.getElementById('ciasc-blocoCadastro').classList.remove('hidden');
    if (t) document.getElementById('ciasc-btnRow').style.display = 'flex';
}

function ciascToggleNovaVlan() {
    document.getElementById('ciasc-blocoNovaVlan').classList.toggle('hidden', !document.getElementById('ciasc-novaVlan').checked);
}

function ciascAdicionarPorta() {
    const c = document.getElementById('ciasc-portasContainer');
    const d = document.createElement('div');
    d.className = 'porta-bloco';
    d.innerHTML = `
<label>Porta TAGG</label>
<select class="portaTagg" style="margin-bottom:10px;">
  <option value="gei-0/1">gei-0/1 — PADRÃO</option>
  <option value="gei-0/2">gei-0/2</option>
  <option value="gei-0/3">gei-0/3</option>
  <option value="gei-0/4">gei-0/4</option>
</select>
<label>VLANs</label>
<div class="vlans-grid">
  ${[650, 690, 903, 601, 602, 603, 604, 605, 606, 999].map(v => `<label class="vlan-item"><input type="checkbox" value="${v}">${v}</label>`).join('')}
</div>
<button class="btn btn-danger" style="margin-top:12px;font-size:12px;padding:7px 14px;" onclick="ciascRemoverPorta(this)">Remover Porta</button>`;
    c.appendChild(d);
}

function ciascRemoverPorta(btn) {
    const blocos = document.querySelectorAll('#ciasc-portasContainer .porta-bloco');
    if (blocos.length === 1) { alert("Mantenha ao menos uma porta."); return; }
    btn.parentElement.remove();
}

function ciascGerar() {
    const tipo = document.getElementById('ciasc-tipo').value;
    if (tipo === 'vpls') ciascGerarVPLS();
    if (tipo === 'cadastro') ciascGerarCadastro();
}

function ciascGerarCadastro() {
    const sn = document.getElementById('ciasc-snonu').value.trim().toUpperCase();
    const ger = document.getElementById('ciasc-gerencia').value.trim();
    const lb = document.getElementById('ciasc-loopback').value.trim();
    if (!sn || !ger || !lb) { alert("Preencha todos os campos!"); return; }
    const vlans = [...document.querySelectorAll('#ciasc-blocoCadastro input[type=checkbox]:checked')].map(x => x.value);
    const r = document.getElementById('ciasc-resultado');
    r.style.display = 'block';
    r.textContent = `${sn} | ZTE ZXR10 | ${ger} | ${lb} | VLANS: ${vlans.join(" / ")}`;
}

function ciascGerarVPLS() {
    const blocos = document.querySelectorAll('#ciasc-portasContainer .porta-bloco');
    let res = '';
    const precisaNova = document.getElementById('ciasc-novaVlan').checked;

    if (precisaNova) {
        const novas = [...document.querySelectorAll('#ciasc-blocoNovaVlan input[type=checkbox]:checked')].map(x => x.value);
        if (novas.length > 0) {
            res += `__________NOVAS VLANS / PSEUDO-WIRES__________\n\n\n`;
            novas.forEach(v => {
                res += `pw pw${v}1\nvpls VPLS-${v}-${ciascNomes[v]}\n  mtu 1508\n  pseudo-wire pw${v}1\n    neighbour 198.18.0.254 vcid 700${v}\n      encapsulation tagged\n    $\n  $\n$\n\n`;
            });
        }
    }

    blocos.forEach(bloco => {
        const porta = bloco.querySelector('.portaTagg').value;
        const vlans = [...bloco.querySelectorAll('.vlans-grid input[type=checkbox]:checked')];
        if (vlans.length > 0) res += `__________CONFIGURAÇÃO SUB-INTERFACES - ${porta}__________\n\n\n`;
        vlans.forEach(vlan => {
            res += `####VLAN${vlan.value}####\n\ninterface ${porta}.${vlan.value}\nexit\nvlan-configuration\ninterface ${porta}.${vlan.value}\nencapsulation-dot1q ${vlan.value}\nexit\nexit\n\nvpls VPLS-${vlan.value}-${ciascNomes[vlan.value]}\n  access-point ${porta}.${vlan.value}\n    access-params ethernet\n\n\n`;
        });
    });

    res += `\n\n__________CONFIGURAÇÃO QOS__________\n\n\n!<car>\nqos\n`;

    blocos.forEach(bloco => {
        const porta = bloco.querySelector('.portaTagg').value;
        [...bloco.querySelectorAll('.vlans-grid input[type=checkbox]:checked')].forEach(vlan => {
            res += `  interface ${porta}.${vlan.value}\n    rate-limit input broadcast cir 100 kbps cbs 16000 pir 2000 kbps pbs 3200 conform-action transmit exceed-action drop violate-action drop\n  $\n`;
        });
    });

    res += `  interface gei-0/10.4042\n    no rate-limit input qos-group 1\n    no rate-limit output qos-group 1\n    rate-limit input outer-vlan 4042 cir 100 mbps cbs 100000 pir 100 mbps pbs 2000 conform-action transmit exceed-action drop violate-action drop\n    rate-limit output outer-vlan 4042 cir 100 mbps cbs 100000 pir 100 mbps pbs 2000 conform-action transmit exceed-action drop violate-action drop\n\n  $\n$\n!</car>`;

    const r = document.getElementById('ciasc-resultado');
    r.style.display = 'block';
    r.textContent = res;
}

function ciascCopiar() {
    const t = document.getElementById('ciasc-resultado').textContent;
    if (t === '—') { alert("Nada para copiar!"); return; }
    navigator.clipboard.writeText(t);
    const m = document.getElementById('ciasc-copiado');
    m.style.display = 'block';
    setTimeout(() => m.style.display = 'none', 1800);
}

function ciascLimpar() {
    // Reset do seletor de ferramenta
    document.getElementById('ciasc-tipo').selectedIndex = 0;

    // Esconde todos os blocos e botões
    document.getElementById('ciasc-blocoVPLS').classList.add('hidden');
    document.getElementById('ciasc-blocoCadastro').classList.add('hidden');
    document.getElementById('ciasc-btnRow').style.display = 'none';
    document.getElementById('ciasc-resultado').style.display = 'none';
    document.getElementById('ciasc-resultado').textContent = '—';
    document.getElementById('ciasc-copiado').style.display = 'none';

    // Reset do bloco VPLS
    document.getElementById('ciasc-novaVlan').checked = false;
    document.getElementById('ciasc-blocoNovaVlan').classList.add('hidden');
    document.querySelectorAll('#ciasc-blocoNovaVlan input[type=checkbox]').forEach(cb => cb.checked = false);

    // Remove portas extras, mantém só a primeira
    const container = document.getElementById('ciasc-portasContainer');
    const blocos = container.querySelectorAll('.porta-bloco');
    blocos.forEach((bloco, i) => { if (i > 0) bloco.remove(); });

    // Reset da porta que sobrou (selects e checkboxes)
    const primeiroBoco = container.querySelector('.porta-bloco');
    if (primeiroBoco) {
        primeiroBoco.querySelector('.portaTagg').selectedIndex = 0;
        primeiroBoco.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
    }

    // Reset do bloco Cadastro
    document.getElementById('ciasc-snonu').value = '';
    document.getElementById('ciasc-gerencia').value = '';
    document.getElementById('ciasc-loopback').value = '';
    document.querySelectorAll('#ciasc-blocoCadastro input[type=checkbox]').forEach(cb => cb.checked = false);
}

/* ══ NTP SERVER ══ */
function ntpGerar() {
    const versao = document.getElementById('ntp-versao').value;
    let resultado = "";

    if (versao === "v6") {
        resultado = `/system clock\n`;
        resultado += `set time-zone-name=America/Sao_Paulo\n`;
        resultado += `/system ntp client\n`;
        resultado += `set enabled=yes primary-ntp=189.45.192.3`;
    } else if (versao === "v7") {
        resultado = `/system clock\n`;
        resultado += `set time-zone-name=America/Sao_Paulo\n`;
        resultado += `/system ntp client\n`;
        resultado += `set enabled=yes\n`;
        resultado += `/system ntp client servers\n`;
        resultado += `add address=189.45.192.3\n`;
        resultado += `add address=177.200.200.20`;
    }

    document.getElementById('ntp-resultado').textContent = resultado;
}

function ntpCopiar() {
    const texto = document.getElementById('ntp-resultado').textContent;

    if (texto === '—') {
        alert("Gere o script primeiro!");
        return;
    }

    navigator.clipboard.writeText(texto);

    const msg = document.getElementById('ntp-copiado');
    msg.style.display = 'block';

    setTimeout(() => {
        msg.style.display = 'none';
    }, 1800);
}

/* ══ ACESSO RADIUS ══ */
function radiusGerar() {
    const scriptPadrao = `/ip service set [find ] address=187.85.161.248/29,189.45.192.0/26,177.54.10.0/29,189.90.48.131/32 disabled=no
/ip service set ftp,telnet,api,api-ssl disabled=yes
/radius remove [find ]
/radius add address=187.85.161.130 secret=99hxSGKae service=login
/radius incoming set accept=no
/user aaa
set default-group=read use-radius=yes
/user group add name=N1-Suporte policy=[/user group get value-name=policy number=[find name=full ]]
/system logging
set 0,1,2,3 action=disk
/system logging action set 3 remote=187.85.161.130 remote-port=8514
/system logging remove [find default=no]
/system logging add action=remote topics=critical
/system logging add action=remote topics=error,!ipsec
/system logging add action=remote topics=info,!dhcp,!firewall
/system logging add action=remote topics=warning,!dhcp
/ip dns
set servers=189.45.192.3,177.200.200.20`;

    document.getElementById('radius-resultado').textContent = scriptPadrao;
}

function radiusCopiar() {
    const texto = document.getElementById('radius-resultado').textContent;

    if (texto === '—') {
        alert("Exiba o script primeiro clicando no botão azul!");
        return;
    }

    navigator.clipboard.writeText(texto);

    const msg = document.getElementById('radius-copiado');
    msg.style.display = 'block';

    setTimeout(() => {
        msg.style.display = 'none';
    }, 1800);
}

/* ══ WIFI BUSINESS ══ */
// Controla visibilidade do identificador Mambo e estado padrao das VLANs

function wifiGerar() {
    const ap = document.getElementById('wifi-ap').value;
    const hotspot = document.getElementById('wifi-mambo').value;
    const identificador = document.getElementById('wifi-identificador').value.trim();

    // Captura as VLANs marcadas
    const v20 = document.getElementById('vlan20').checked;
    const v30 = document.getElementById('vlan30').checked;
    const v40 = document.getElementById('vlan40').checked;
    const v50 = document.getElementById('vlan50').checked;
    const v60 = document.getElementById('vlan60').checked;

    if (hotspot === 'mambo' && !identificador) {
        alert("Para gerar o script Mambo, digite o Identificador!");
        return;
    }
    if (hotspot === 'mambo' && !v20) {
        alert("O Hotspot Mambo exige que a VLAN 20 seja criada. Marque a VLAN 20.");
        return;
    }

    // 1. BLOCO BÁSICO (Obrigatório para todos)
    let script = `#BASICO\n/user add name=admin.local password=#@!4432dDA45 group=full\n/ip dns set servers=8.8.8.8,8.8.4.4\n#SOMENTE PORTA 5 CASO, NECESSITAR ADICIONAR MAIS BA BRIDGE-LAN\n/interface bridge port remove [find interface=ether5]\n/interface bridge add name=BRIDGE-LAN protocol-mode=rstp\n/interface bridge port add interface=ether5 bridge=BRIDGE-LAN\n/ip address add address=192.168.200.1/24 interface=BRIDGE-LAN\n/ip pool add name=POOL_BRIDGE_LAN ranges=192.168.200.2-192.168.200.254\n\n`;

    // 2. BLOCO ADOÇÃO (Dinâmico)
    if (ap === 'tplink') {
        script += `#ADOCAO TPLINK\n/ip dhcp-server network add address=192.168.200.0/24 gateway=192.168.200.1 dns-server=8.8.8.8,8.8.4.4 caps-manager=187.85.164.32 comment=ADOTA_TPLINK_NO_CAPS_MANAGERS\n/ip dhcp-server add name=DHCP_ADOCAO lease-time=00:10:00 address-pool=POOL_BRIDGE_LAN interface=BRIDGE-LAN authoritative=yes add-arp=yes disabled=no\n/ip firewall nat add chain=srcnat src-address=192.168.200.0/24 action=masquerade comment=REDE_ADOCAO\n\n`;
    } else if (ap === 'unifi') {
        script += `#DHCP UNIFI\n/ip dhcp-server add name=DHCP_ADOCAO lease-time=00:10:00 address-pool=POOL_BRIDGE_LAN interface=BRIDGE-LAN authoritative=yes add-arp=yes disabled=no\n/ip dhcp-server network add address=192.168.200.0/24 gateway=192.168.200.1 dns-server=8.8.8.8,8.8.4.4 comment=REDE_ADOCAO\n/ip firewall nat add chain=srcnat src-address=192.168.200.0/24 action=masquerade comment=REDE_ADOCAO\n\n`;
    }

    // 3. CRIAÇÃO DAS VLANS (Dinâmico)
    if (v20 || v30 || v40 || v50 || v60) script += `#ADICIONAR VLANS\n`;
    if (v20) script += `/interface vlan add name=VLAN_20_HOTSPOT vlan-id=20 interface=BRIDGE-LAN\n`;
    if (v30) script += `/interface vlan add name=VLAN_30_MAQ_CARTAO vlan-id=30 interface=BRIDGE-LAN\n`;
    if (v40) script += `/interface vlan add name=VLAN_40_CORPORATIVO vlan-id=40 interface=BRIDGE-LAN\n`;
    if (v50) script += `/interface vlan add name=VLAN_50_RESERVA vlan-id=50 interface=BRIDGE-LAN\n`;
    if (v60) script += `/interface vlan add name=VLAN_60_GERENCIA vlan-id=60 interface=BRIDGE-LAN\n`;
    script += `\n`;

    // 4. IP, DHCP E NAT (Dinâmico)
    if (v60) {
        script += `#ADDRESS REDE_GERENCIA ->>>>>>>>> REDE_GERENCIA / VLAN_60\n/ip address add address=10.20.20.1/24 interface=VLAN_60_GERENCIA\n/ip pool add name=POOL_GERENCIA ranges=10.20.20.2-10.20.20.254\n/ip dhcp-server network add address=10.20.20.0/24 gateway=10.20.20.1 dns-server=8.8.8.8,8.8.4.4\n/ip dhcp-server add name=DHCP_GERENCIA lease-time=01:59:00 address-pool=POOL_GERENCIA interface=VLAN_60_GERENCIA authoritative=yes add-arp=yes disabled=no conflict-detection=no\n/ip firewall nat add chain=srcnat src-address=10.20.20.0/24 action=masquerade comment=REDE_GERENCIA\n/ip firewall nat add chain=srcnat action=masquerade\n\n`;
    }
    if (v50) {
        script += `#ADDRESS REDE_RESERVA ->>>>>>>>> REDE_RESERVA - VLAN_50\n/ip address add address=10.15.12.1/22 interface=VLAN_50_RESERVA disabled=no\n/ip pool add name=POOL_RESERVA ranges=10.15.12.2-10.15.15.254\n/ip dhcp-server network add address=10.15.12.0/22 gateway=10.15.12.1 dns-server=8.8.8.8,8.8.4.4\n/ip dhcp-server add name=DHCP_RESERVA lease-time=00:15:00 address-pool=POOL_RESERVA interface=VLAN_50_RESERVA authoritative=yes add-arp=yes disabled=no conflict-detection=no\n/ip firewall nat add chain=srcnat src-address=10.15.12.0/22 action=masquerade comment=REDE_RESERVA\n\n`;
    }
    if (v40) {
        script += `#ADDRESS REDE_CORP ->>>>>>>>> REDE_CORP - VLAN_40\n/ip address add address=10.10.10.1/23 interface=VLAN_40_CORPORATIVO\n/ip pool add name=POOL_CORP ranges=10.10.10.2-10.10.11.254\n/ip dhcp-server network add address=10.10.10.0/23 gateway=10.10.10.1 dns-server=8.8.8.8,8.8.4.4\n/ip dhcp-server add name=DHCP_CORP lease-time=00:30:00 address-pool=POOL_CORP interface=VLAN_40_CORPORATIVO authoritative=yes add-arp=yes disabled=no conflict-detection=no\n/ip firewall nat add chain=srcnat src-address=10.10.10.0/23 action=masquerade comment=REDE_CORPORATIVA\n\n`;
    }
    if (v30) {
        script += `#ADDRESS MAQ_CARTAO ->>>>>>>>> REDE_MAQUINAS_CARTAO - VLAN_30\n/ip address add address=10.5.4.1/23 interface=VLAN_30_MAQ_CARTAO disabled=no\n/ip pool add name=POOL_MAQ_CARTAO ranges=10.5.4.2-10.5.5.254\n/ip dhcp-server network add address=10.5.4.0/23 gateway=10.5.4.1 dns-server=8.8.8.8,8.8.4.4\n/ip dhcp-server add name=DHCP_MAQ_CARTAO lease-time=00:30:00 address-pool=POOL_MAQ_CARTAO interface=VLAN_30_MAQ_CARTAO authoritative=yes add-arp=yes disabled=no conflict-detection=no\n/ip firewall nat add chain=srcnat src-address=10.5.4.0/23 action=masquerade comment=REDE_MAQ_CARTAO\n\n`;
    }
    if (v20 && hotspot === 'mambo') {
        // Mambo: cria VLAN 20 com address completo (hotspot autentica via Mambo)
        script += `#ADDRESS HOTSPOT ->>>>>>>>> REDE_HOTSPOT - VLAN_20\n/ip address add address=10.0.0.1/22 interface=VLAN_20_HOTSPOT\n/ip pool add name=POOL_HOTSPOT ranges=10.0.0.2-10.0.3.254\n/ip dhcp-server network add address=10.0.0.0/22 gateway=10.0.0.1 dns-server=8.8.8.8,8.8.4.4\n/ip dhcp-server add name=DHCP_HOTSPOT lease-time=00:15:00 address-pool=POOL_HOTSPOT interface=VLAN_20_HOTSPOT authoritative=yes add-arp=yes disabled=no\n/ip firewall nat add chain=srcnat src-address=10.0.0.0/22 action=masquerade comment=REDE_HOTSPOT\n\n`;
    } else if (v20 && hotspot === 'wifeed') {
        // Wifeed: cria VLAN 20 sem address (Wifeed gerencia o hotspot externamente)
        script += `#VLAN_20 HOTSPOT ->>>>>>>>> VLAN criada para Wifeed (sem address local)\n# O Wifeed gerencia autenticacao externamente - nao configurar address na VLAN_20\n\n`;
    }

    // 5. ISOLAMENTO (Sempre forçado e Dinâmico - isola automaticamente o que foi criado)
    if (v20 || v30 || v40 || v50) {
        script += `OBRIGATÓRIO NO SCRIPT\n#ISOLAR TODAS AS REDES\n`;
        if (v20) script += `/ip firewall address-list add address=10.0.0.0/22 list=BLOCK_REDES\n`;
        if (v30) script += `/ip firewall address-list add address=10.5.4.0/23 list=BLOCK_REDES\n`;
        if (v40) script += `/ip firewall address-list add address=10.10.10.0/23 list=BLOCK_REDES\n`;
        if (v50) script += `/ip firewall address-list add address=10.15.12.0/22 list=BLOCK_REDES\n`;

        if (v30) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.5.4.0/23\n`;
        if (v40) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.10.10.0/23\n`;
        if (v50) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.15.12.0/22\n`;
        if (v20) script += `/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.0.0.0/22 dst-address=!10.0.0.1\n`;

        script += `\n#BLOCK RAW CONTROLE POR IP\n/ip firewall raw add chain=prerouting src-address=10.5.4.0/23 src-address-list=LIBERA_ACESSO action=accept disabled=yes\n/ip firewall address-list add list=LIBERA_ACESSO address=8.8.4.4\n/ip firewall raw add chain=prerouting src-address=10.5.4.0/23  action=drop disabled=yes\n\n`;
    }

    // 6. SCRIPT MAMBO (somente quando 'Sim, com Mambo' selecionado)
    if (hotspot === 'mambo') {
        script += `HOTSPOT MAMBO ->>>>>>>>> SCRIPT\n\n/ip hotspot add addresses-per-mac=unlimited disabled=no interface=VLAN_20_HOTSPOT name=${identificador} address-pool=POOL_HOTSPOT\n/ip hotspot profile set [ find default=yes ] login-by=http-pap,mac-cookie radius-mac-format=XX-XX-XX-XX-XX-XX use-radius=yes radius-interim-update=00:15:00 radius-default-domain=mambo\n/ip hotspot user profile set [ find default=yes ] idle-timeout=10m keepalive-timeout=10m\n/ip hotspot profile set [find name=default] hotspot-address=10.0.0.1\n \n/ip hotspot walled-garden\nadd dst-host=mambowifi\nadd dst-host=unifique\n\n#facebook\nadd dst-host=facebook.com disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=akamai disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=facebook.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=fbcdn.net disabled=yes comment=Ativar_autenticar_rede_sociais\n\n#twitter\nadd dst-host=twitter disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=twimg disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=fastly.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=edgecastcdn.net disabled=yes comment=Ativar_autenticar_rede_sociais\n\n#instagram\nadd dst-host=instagram.com disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=doubleclick.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=www.google.com \nadd dst-host=www.google.com.br \n\n/ip firewall address-list add address=uploads.mambowifi.com list=mambo\n/ip firewall address-list add address=mambowifi.com list=mambo\n/ip firewall address-list add address=unifique.com.br list=mambo\n/ip firewall address-list add address=facebook.com list=facebook\n/ip firewall address-list add address=facebook.net list=facebook\n/ip firewall address-list add address=akamaihd.net list=facebook\n/ip firewall address-list add address=fbcdn.net list=facebook\n/ip firewall address-list add address=www.googleapis.com list=google\n/ip firewall address-list add address=ssl.gstatic.com list=google\n/ip firewall address-list add address=fonts.gstatic.com list=google\n/ip firewall address-list add address=www.gstatic.com list=google\n/ip firewall address-list add address=accounts.google.com list=google\n/ip firewall address-list add address=accounts.youtube.com list=google\n/ip firewall address-list add address=accounts.google.com.br list=google\n/ip firewall address-list add address=gstatic.com list=google\n/ip firewall address-list add address=twitter.com list=twitter\n/ip firewall address-list add address=twimg.com list=twitter\n/ip firewall address-list add address=abs.twitter.com list=twitter\n\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address-list=mambo\n/ip hotspot walled-garden ip add action=accept disabled=yes dst-address-list=facebook comment=Ativar_autenticar_rede_sociais\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address-list=google \n/ip hotspot walled-garden ip add action=accept disabled=yes dst-address-list=twitter comment=Ativar_autenticar_rede_sociais\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address=168.138.229.153 !dst-address-list !dst-port !protocol !src-address !src-address-list\n/ip hotspot walled-garden ip add action=accept disabled=no dst-address=168.138.226.107 !dst-address-list !dst-port !protocol !src-address !src-address-list\n \n/radius add address=168.138.226.107 secret="wide\\$123" service=hotspot domain=mambo timeout=00:00:03\n/radius add address=168.138.229.153 secret="wide\\$123" service=hotspot domain=mambo timeout=00:00:03\n/ip firewall nat add chain=srcnat  src-address=168.138.226.107 action=masquerade comment=RADIUS-MAMBO\n/ip firewall nat add chain=srcnat  src-address=168.138.229.153 action=masquerade comment=RADIUS-MAMBO\n\n`;
    }

    // 7. INSTRUÇÕES UNIFI
    if (ap === 'unifi') {
        script += `\n========== INSTRUÇÕES DE ADOÇÃO UNIFI ==========\nACESSANDO O UNIFI\nNo terminal da MikroTik, digite o seguinte comando e insira o IP do AP no lugar dos "x": system ssh user=ubnt xxx.xxx.xxx.xxx\nQuando solicitado, insira a senha do dispositivo UniFi. O padrão é geralmente "ubnt". Pressione Enter após inserir a senha.\n\nCONFIGURANDO O UNIFI\nApós se conectar ao UniFi, digite o seguinte comando: set-inform http://187.85.164.26:8880/inform\nEsse comando informa ao AP UniFi onde encontrar a controladora.\n\nRESETANDO O UNIFI\nPara resetar o AP, é preciso acessa-lo e digitar o seguinte comando: syswrapper.sh restore-default\n\nREINICIANDO O UNIFI\nSe o AP UniFi ainda não subir, você pode reiniciá-lo manualmente.\nNo terminal do UniFi, digite o comando: Reboot now\n`;
    }

    const resBox = document.getElementById('wifi-resultado');
    resBox.style.display = 'block';
    resBox.textContent = script;
}

function novoToggleTipo() {
    const tipo = document.getElementById('novo-tipo').value;
    const ptpLabel = document.getElementById('novo-label-ptp');

    if (tipo === 'GPON') {
        document.getElementById('novo-bloco-gpon').classList.remove('hidden');
        document.getElementById('novo-bloco-ptp').classList.add('hidden');
        ptpLabel.textContent = 'IP PTP (WAN)';
    } else {
        document.getElementById('novo-bloco-gpon').classList.add('hidden');
        document.getElementById('novo-bloco-ptp').classList.remove('hidden');
        ptpLabel.textContent = 'IP PTP Local';
    }
}

function novoGerar() {
    // 1. DADOS DO IDENTITY (Restaurados)
    const modelo = document.getElementById('novo-modelo').value;
    const tipo = document.getElementById('novo-tipo').value;
    const cidade = document.getElementById('novo-cidade').value.trim().toUpperCase();
    const cliente = document.getElementById('novo-cliente').value.trim();
    const circuito = document.getElementById('novo-circuito').value.trim();
    const nomeRaw = document.getElementById('novo-nome').value.trim().toUpperCase();
    const nome = nomeRaw.normalize ? nomeRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : nomeRaw;
    const nomeClean = nome.replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, "_");

    if (!cidade || !cliente || !circuito || !nomeClean) {
        alert("Preencha todos os campos do cliente (Cidade, Código, Circuito e Nome)!");
        return;
    }

    const local = modelo === 'interconexao' ? document.getElementById('novo-local').value : null;
    const identity = modelo === 'interconexao'
        ? `CUST-RB-${tipo}-${local}-${cidade}-${cliente}-${circuito}-${nomeClean}`
        : `CUST-RB-${tipo}-${cidade}-${cliente}-${circuito}-${nomeClean}`;

    // 2. DADOS DA OBSERVAÇÃO BLINDADOS (Com o ?.)
    const sn = document.getElementById('novo-sn')?.value.trim().toUpperCase() || "";
    const mac = document.getElementById('novo-mac')?.value.trim().toUpperCase() || "";
    const swLocal = document.getElementById('novo-sw-local')?.value.trim().toUpperCase() || "";
    const swRemoto = document.getElementById('novo-sw-remoto')?.value.trim().toUpperCase() || "";
    const ptpRemoto = document.getElementById('novo-ptp-remoto')?.value.trim() || "";
    const ipPtp = document.getElementById('novo-ptp')?.value.trim() || "";
    const ipRede = document.getElementById('novo-rede')?.value.trim() || "";

    let obsStr = "";
    if (tipo === 'GPON') {
        const parts = [];
        if (sn) parts.push(sn);
        if (ipPtp) parts.push(`PTP: ${ipPtp}`);
        if (ipRede) parts.push(`Rede: ${ipRede}`);
        if (mac) parts.push(mac);
        if (parts.length > 0) obsStr = parts.join(" | ");
    } else {
        const parts = [];
        if (swLocal && ipPtp) parts.push(`${swLocal} - ${ipPtp}`);
        if (swRemoto && ptpRemoto) parts.push(`${swRemoto} - ${ptpRemoto}`);
        if (ipRede) parts.push(`Rede: ${ipRede}`);
        if (parts.length > 0) obsStr = parts.join(" | ");
    }

    // 3. LÓGICA DO SCRIPT MIKROTIK
    let combined = `--- IDENTITY ---\n/system identity set name="${identity}"\n\n`;

    if (document.getElementById('novo-includeRadius').checked) {
        const radiusScript = `/ip service set [find ] address=187.85.161.248/29,189.45.192.0/26,177.54.10.0/29,189.90.48.131/32 disabled=no\n/ip service set ftp,telnet,api,api-ssl disabled=yes\n/radius remove [find ]\n/radius add address=187.85.161.130 secret=99hxSGKae service=login\n/radius incoming set accept=no\n/user aaa\nset default-group=read use-radius=yes\n/user group add name=N1-Suporte policy=[/user group get value-name=policy number=[find name=full ]]\n/system logging\nset 0,1,2,3 action=disk\n/system logging action set 3 remote=187.85.161.130 remote-port=8514\n/system logging remove [find default=no]\n/system logging add action=remote topics=critical\n/system logging add action=remote topics=error,!ipsec\n/system logging add action=remote topics=info,!dhcp,!firewall\n/system logging add action=remote topics=warning,!dhcp\n/ip dns\nset servers=189.45.192.3,177.200.200.20`;
        combined += `--- RADIUS E SERVICOS ---\n${radiusScript}\n\n`;
    }

    if (document.getElementById('novo-includeNtp').checked) {
        const v = document.getElementById('novo-ntp-versao').value;
        let ntpScript = "";
        if (v === "v6") {
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

    // Renderiza a caixa de Observação
    const obsBox = document.getElementById('novo-obs-resultado');
    if (obsBox) {
        if (obsStr !== "") {
            obsBox.style.display = 'block';
            obsBox.textContent = `OBS: ${obsStr}`;
        } else {
            obsBox.style.display = 'none';
            obsBox.textContent = '—';
        }
    }
}

function novoGerarSoRadius() {
    const radiusScript = `/ip service set [find ] address=187.85.161.248/29,189.45.192.0/26,177.54.10.0/29,189.90.48.131/32 disabled=no
/ip service set ftp,telnet,api,api-ssl disabled=yes
/radius remove [find ]
/radius add address=187.85.161.130 secret=99hxSGKae service=login
/radius incoming set accept=no
/user aaa
set default-group=read use-radius=yes
/user group add name=N1-Suporte policy=[/user group get value-name=policy number=[find name=full ]]
/system logging
set 0,1,2,3 action=disk
/system logging action set 3 remote=187.85.161.130 remote-port=8514
/system logging remove [find default=no]
/system logging add action=remote topics=critical
/system logging add action=remote topics=error,!ipsec
/system logging add action=remote topics=info,!dhcp,!firewall
/system logging add action=remote topics=warning,!dhcp
/ip dns
set servers=189.45.192.3,177.200.200.20`;

    const resultBox = document.getElementById('novo-id-resultado');
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.textContent = `--- RADIUS E SERVICOS ---\n${radiusScript}`;
    }
    // Esconde obs pois não tem dados de cliente
    const obsBox = document.getElementById('novo-obs-resultado');
    if (obsBox) { obsBox.style.display = 'none'; obsBox.textContent = '—'; }
}

function novoGerarSoNtp() {
    const v = document.getElementById('novo-ntp-versao').value;
    let ntpScript = "";
    if (v === "v6") {
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
    if (obsBox) { obsBox.style.display = 'none'; obsBox.textContent = '—'; }
}

function novoCopiar() {
    const obsBox = document.getElementById('novo-obs-resultado');
    const scriptBox = document.getElementById('novo-id-resultado');

    let textoFinal = "";

    // Adiciona a observação no topo do Cópia (se existir e estiver visível)
    if (obsBox && obsBox.style.display !== 'none' && obsBox.textContent !== '—') {
        textoFinal += obsBox.textContent + "\n\n";
    }

    // Adiciona o script de configuração
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
        setTimeout(() => msg.style.display = 'none', 1800);
    }
}

function wifiCopiar() {
    const texto = document.getElementById('wifi-resultado').textContent;
    if (texto === '—') {
        alert("Gere o script primeiro!");
        return;
    }
    navigator.clipboard.writeText(texto);
    const msg = document.getElementById('wifi-copiado');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 1800);
}

/* ══ VERIFICADOR EQUIPAMENTOS ══ */
const eqDados = {
    modalidades: {
        dedicado: {
            nome: "Dedicado", viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)", planos: {
                        "100-200mega": { equipamento: "F601 + RB750G3" },
                        "200-400mega": { equipamento: "F601 + RB3011" },
                        "500-1000mega": { equipamento: "F601 + RB4011" }
                    }
                },
                ptp: { nome: "Ponto-a-Ponto (PTP)", regraEspecial: "PTP-DEDICADO-01" }
            }
        },
        interlan: {
            nome: "Interconexão", viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)", planos: {
                        "100-200mega": { equipamento: "F601 + RB750G3" },
                        "200-400mega": { equipamento: "F601 + RB3011" },
                        "500-1000mega": { equipamento: "F601 + RB4011" }
                    }
                },
                ptp: { nome: "Ponto-a-Ponto (PTP)", regraEspecial: "PTP-INTERLAN-01" }
            }
        },
        wifibussines: {
            nome: "Wifi-Bussines", viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)", planos: {
                        "100-500mega": { equipamento: "F601 + RB750G3 + AP(s) OMADA TPLINK", obs: "Máximo de 3 APs; se precisar de mais, abrir tarefa com TI" },
                        "500mega-700mega": { equipamento: "F601 + RB3011 + AP(s) OMADA TPLINK", obs: "Máximo de 3 APs; se precisar de mais, abrir tarefa com TI" },
                        "1000mega": { equipamento: "F601 + RB4011 + AP(s) OMADA TPLINK", obs: "Máximo de 3 APs; se precisar de mais, abrir tarefa com TI" }
                    }
                },
                ptp: { nome: "Ponto-a-Ponto (PTP)", regraEspecial: "PTP-BL-01" }
            }
        },
        bandalarga: {
            nome: "Banda Larga PF/PJ", viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)", planos: {
                        "100-600mega": { equipamento: "Tplink XC220-G3", mesh: "Tplink HC 220 — Wi-fi5" },
                        "100-600mega + adicional Wifi 6": { equipamento: "ZTE ONT F6600", mesh: "ZTE H3601", obs: "Quatro portas GE LAN" },
                        "600mega + telefonia": { equipamento: "Tplink XC220-G3 + ATA Khomp", mesh: "Tplink HC 220 — Wi-fi5", obs: "Para linha(s) fixa(s) Unifique" },
                        "600mega + 2serviçosUnifique": { equipamento: "ZTE ONT F670L", mesh: "ZTE H119A", obs: "Necessário para uso de portas LAN" },
                        "660mega-1000mega": { equipamento: "ZTE ONT F6600", mesh: "ZTE H3601", obs: "Quatro portas GE LAN" },
                        "2000-5000mega": { equipamento: "ZTE ONT F8648P", mesh: "ZTE H3601", obs: "Uma porta 10GE" }
                    }
                },
                ptp: { nome: "Ponto-a-Ponto (PTP)", regraEspecial: "PTP-BL-01" }
            }
        }
    },
    comentarios: {
        "PTP-DEDICADO-01": "Dedicados PTP dependem de projeto da engenharia — consulte o protocolo e veja o projeto gerado.",
        "PTP-INTERLAN-01": "Interconexões PTP dependem de projeto da engenharia — consulte o protocolo e veja o projeto.",
        "PTP-BL-01": "Banda Larga PTP dependem de projeto da engenharia — consulte o protocolo e veja o projeto."
    }
};

function eqFormatarPlano(nome) {
    return nome.charAt(0).toUpperCase() + nome.replace(/([a-z])([0-9])/g, '$1 $2').slice(1);
}

function eqPopular(sel, obj, def, fmt) {
    sel.innerHTML = `<option value="">${def}</option>`;
    Object.keys(obj).forEach(k => {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = fmt ? fmt(k) : obj[k].nome;
        sel.appendChild(o);
    });
}

const eqMod = document.getElementById('eq-modalidade');
const eqVia = document.getElementById('eq-viabilidade');
const eqPla = document.getElementById('eq-plano');
const eqRes = document.getElementById('eq-resultado');

eqPopular(eqMod, eqDados.modalidades, 'Selecione');

eqMod.addEventListener('change', () => {
    eqVia.innerHTML = '<option value="">Selecione</option>';
    eqPla.innerHTML = '<option value="">Selecione</option>';
    eqVia.disabled = true; eqPla.disabled = true;
    eqRes.innerHTML = '<h3>Resultado</h3><p style="color:var(--text3);font-size:13px;">Selecione as opções acima.</p>';
    if (!eqMod.value) return;
    const vias = eqDados.modalidades[eqMod.value]?.viabilidades;
    if (vias && Object.keys(vias).length) { eqPopular(eqVia, vias, 'Selecione'); eqVia.disabled = false; }
});

eqVia.addEventListener('change', () => {
    eqPla.innerHTML = '<option value="">Selecione</option>';
    eqPla.disabled = true;
    eqRes.innerHTML = '<h3>Resultado</h3><p style="color:var(--text3);font-size:13px;">Selecione as opções acima.</p>';
    if (!eqVia.value) return;
    const vObj = eqDados.modalidades[eqMod.value]?.viabilidades[eqVia.value];
    if (!vObj) return;
    if (vObj.regraEspecial) {
        eqRes.innerHTML = `<h3>Resultado</h3><p class="equip-alert">⚠ ${eqDados.comentarios[vObj.regraEspecial]}</p>`;
        return;
    }
    eqPopular(eqPla, vObj.planos, 'Selecione', eqFormatarPlano);
    eqPla.disabled = false;
});

eqPla.addEventListener('change', () => {
    if (!eqPla.value) return;
    const plano = eqDados.modalidades[eqMod.value]?.viabilidades[eqVia.value]?.planos[eqPla.value];
    if (!plano) return;
    const modNome = eqDados.modalidades[eqMod.value].nome;
    const viaNome = eqDados.modalidades[eqMod.value].viabilidades[eqVia.value].nome;
    let html = `<h3>Resultado</h3>
<div class="equip-row"><strong>Modalidade</strong><span>${modNome}</span></div>
<div class="equip-row"><strong>Viabilidade</strong><span>${viaNome}</span></div>
<div class="equip-row"><strong>Plano</strong><span>${eqFormatarPlano(eqPla.value)}</span></div>
<div class="equip-row"><strong>Equipamento</strong><span style="color:var(--accent2);font-weight:600;">${plano.equipamento}</span></div>`;
    if (plano.mesh) html += `<div class="equip-row"><strong>Mesh</strong><span>${plano.mesh}</span></div>`;
    if (plano.obs) html += `<div class="equip-row"><strong>Observação</strong><span style="color:var(--amber);">${plano.obs}</span></div>`;
    eqRes.innerHTML = html;
});