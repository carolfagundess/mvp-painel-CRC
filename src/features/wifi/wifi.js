const WIFI_IDENTIFICADOR_WRAP_ID = 'wifi-identificador-wrap';
const WIFI_IDENTIFICADOR_ID = 'wifi-identificador';
const WIFI_MAMBO_ID = 'wifi-mambo';

export function wifiHotspotChange() {
    const select = document.getElementById(WIFI_MAMBO_ID);
    const wrap = document.getElementById(WIFI_IDENTIFICADOR_WRAP_ID);
    const input = document.getElementById(WIFI_IDENTIFICADOR_ID);
    if (!select || !wrap || !input) return;

    const mostra = select.value === 'mambo';
    wrap.style.display = mostra ? 'block' : 'none';
    if (!mostra) input.value = '';
}

export function wifiGerar() {
    const ap = document.getElementById('wifi-ap').value;
    const hotspot = document.getElementById('wifi-mambo').value;
    const identificador = document.getElementById('wifi-identificador').value.trim();

    const v20 = document.getElementById('vlan20').checked;
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

    let script = `#BASICO\n/user add name=admin.local password=#@!4432dDA45 group=full\n/ip dns set servers=8.8.8.8,8.8.4.4\n#SOMENTE PORTA 5 CASO, NECESSITAR ADICIONAR MAIS BA BRIDGE-LAN\n/interface bridge port remove [find interface=ether5]\n/interface bridge add name=BRIDGE-LAN protocol-mode=rstp\n/interface bridge port add interface=ether5 bridge=BRIDGE-LAN\n/ip address add address=192.168.200.1/24 interface=BRIDGE-LAN\n/ip pool add name=POOL_BRIDGE_LAN ranges=192.168.200.2-192.168.200.254\n\n`;

    if (ap === 'tplink') {
        script += `#ADOCAO TPLINK\n/ip dhcp-server network add address=192.168.200.0/24 gateway=192.168.200.1 dns-server=8.8.8.8,8.8.4.4 caps-manager=187.85.164.32 comment=ADOTA_TPLINK_NO_CAPS_MANAGERS\n/ip dhcp-server add name=DHCP_ADOCAO lease-time=00:10:00 address-pool=POOL_BRIDGE_LAN interface=BRIDGE-LAN authoritative=yes add-arp=yes disabled=no\n/ip firewall nat add chain=srcnat src-address=192.168.200.0/24 action=masquerade comment=REDE_ADOCAO\n\n`;
    } else if (ap === 'unifi') {
        script += `#DHCP UNIFI\n/ip dhcp-server add name=DHCP_ADOCAO lease-time=00:10:00 address-pool=POOL_BRIDGE_LAN interface=BRIDGE-LAN authoritative=yes add-arp=yes disabled=no\n/ip dhcp-server network add address=192.168.200.0/24 gateway=192.168.200.1 dns-server=8.8.8.8,8.8.4.4 comment=REDE_ADOCAO\n/ip firewall nat add chain=srcnat src-address=192.168.200.0/24 action=masquerade comment=REDE_ADOCAO\n\n`;
    }

    if (v20 || v30 || v40 || v50 || v60) script += '#ADICIONAR VLANS\n';
    if (v20) script += '/interface vlan add name=VLAN_20_HOTSPOT vlan-id=20 interface=BRIDGE-LAN\n';
    if (v30) script += '/interface vlan add name=VLAN_30_MAQ_CARTAO vlan-id=30 interface=BRIDGE-LAN\n';
    if (v40) script += '/interface vlan add name=VLAN_40_CORPORATIVO vlan-id=40 interface=BRIDGE-LAN\n';
    if (v50) script += '/interface vlan add name=VLAN_50_RESERVA vlan-id=50 interface=BRIDGE-LAN\n';
    if (v60) script += '/interface vlan add name=VLAN_60_GERENCIA vlan-id=60 interface=BRIDGE-LAN\n';
    script += '\n';

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
        script += `#ADDRESS HOTSPOT ->>>>>>>>> REDE_HOTSPOT - VLAN_20\n/ip address add address=10.0.0.1/22 interface=VLAN_20_HOTSPOT\n/ip pool add name=POOL_HOTSPOT ranges=10.0.0.2-10.0.3.254\n/ip dhcp-server network add address=10.0.0.0/22 gateway=10.0.0.1 dns-server=8.8.8.8,8.8.4.4\n/ip dhcp-server add name=DHCP_HOTSPOT lease-time=00:15:00 address-pool=POOL_HOTSPOT interface=VLAN_20_HOTSPOT authoritative=yes add-arp=yes disabled=no\n/ip firewall nat add chain=srcnat src-address=10.0.0.0/22 action=masquerade comment=REDE_HOTSPOT\n\n`;
    } else if (v20 && hotspot === 'wifeed') {
        script += `#VLAN_20 HOTSPOT ->>>>>>>>> VLAN criada para Wifeed (sem address local)\n# O Wifeed gerencia autenticacao externamente - nao configurar address na VLAN_20\n\n`;
    }

    if (v20 || v30 || v40 || v50) {
        script += `OBRIGATÓRIO NO SCRIPT\n#ISOLAR TODAS AS REDES\n`;
        if (v20) script += '/ip firewall address-list add address=10.0.0.0/22 list=BLOCK_REDES\n';
        if (v30) script += '/ip firewall address-list add address=10.5.4.0/23 list=BLOCK_REDES\n';
        if (v40) script += '/ip firewall address-list add address=10.10.10.0/23 list=BLOCK_REDES\n';
        if (v50) script += '/ip firewall address-list add address=10.15.12.0/22 list=BLOCK_REDES\n';

        if (v30) script += '/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.5.4.0/23\n';
        if (v40) script += '/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.10.10.0/23\n';
        if (v50) script += '/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.15.12.0/22\n';
        if (v20) script += '/ip firewall raw add chain=prerouting dst-address-list=BLOCK_REDES action=drop src-address=10.0.0.0/22 dst-address=!10.0.0.1\n';

        script += `\n#BLOCK RAW CONTROLE POR IP\n/ip firewall raw add chain=prerouting src-address=10.5.4.0/23 src-address-list=LIBERA_ACESSO action=accept disabled=yes\n/ip firewall address-list add list=LIBERA_ACESSO address=8.8.4.4\n/ip firewall raw add chain=prerouting src-address=10.5.4.0/23  action=drop disabled=yes\n\n`;
    }

    if (hotspot === 'mambo') {
        script += `HOTSPOT MAMBO ->>>>>>>>> SCRIPT\n\n/ip hotspot add addresses-per-mac=unlimited disabled=no interface=VLAN_20_HOTSPOT name=${identificador} address-pool=POOL_HOTSPOT\n/ip hotspot profile set [ find default=yes ] login-by=http-pap,mac-cookie radius-mac-format=XX-XX-XX-XX-XX-XX use-radius=yes radius-interim-update=00:15:00 radius-default-domain=mambo\n/ip hotspot user profile set [ find default=yes ] idle-timeout=10m keepalive-timeout=10m\n/ip hotspot profile set [find name=default] hotspot-address=10.0.0.1\n \n/ip hotspot walled-garden\nadd dst-host=mambowifi\nadd dst-host=unifique\n\n#facebook\nadd dst-host=facebook.com disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=akamai disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=facebook.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=fbcdn.net disabled=yes comment=Ativar_autenticar_rede_sociais\n\n#twitter\nadd dst-host=twitter disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=twimg disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=fastly.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=edgecastcdn.net disabled=yes comment=Ativar_autenticar_rede_sociais\n\n#instagram\nadd dst-host=instagram.com disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=doubleclick.net disabled=yes comment=Ativar_autenticar_rede_sociais\nadd dst-host=www.google.com \nadd dst-host=www.google.com.br \n\n/ip firewall address-list add address=uploads.mambowifi.com list=mambo\n/ip firewall address-list add address=mambowifi.com list=mambo\n/ip firewall address-list add address=unifique.com.br list=mambo\n/ip firewall address-list add address=facebook.com list=facebook\n/ip firewall address-list add address=facebook.net list=facebook\n/ip firewall address-list add address=akamaihd.net list=facebook\n/ip firewall address-list add address=fbcdn.net list=facebook\n/ip firewall address-list add address=www.googleapis list=google\n\n`;
    }

    if (ap === 'unifi') {
        script += `\n========== INSTRUÇÕES DE ADOÇÃO UNIFI ==========\nACESSANDO O UNIFI\nNo terminal da MikroTik, digite o seguinte comando e insira o IP do AP no lugar dos "x": system ssh user=ubnt xxx.xxx.xxx.xxx\nQuando solicitado, insira a senha do dispositivo UniFi. O padrão é geralmente "ubnt". Pressione Enter após inserir a senha.\n\nCONFIGURANDO O UNIFI\nApós se conectar ao UniFi, digite o seguinte comando: set-inform http://187.85.164.26:8880/inform\nEsse comando informa ao AP UniFi onde encontrar a controladora.\n\nRESETANDO O UNIFI\nPara resetar o AP, é preciso acessa-lo e digitar o seguinte comando: syswrapper.sh restore-default\n\nREINICIANDO O UNIFI\nSe o AP UniFi ainda não subir, você pode reiniciá-lo manualmente.\nNo terminal do UniFi, digite o comando: Reboot now\n`;
    }

    const resBox = document.getElementById('wifi-resultado');
    resBox.style.display = 'block';
    resBox.textContent = script;
}

export function wifiCopiar() {
    const texto = document.getElementById('wifi-resultado').textContent;
    if (texto === '—') {
        alert('Gere o script primeiro!');
        return;
    }
    navigator.clipboard.writeText(texto);
    const msg = document.getElementById('wifi-copiado');
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
    }, 1800);
}

export function wifiLimpar() {
    const campos = ['wifi-ap', 'wifi-mambo', 'wifi-identificador'];
    campos.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') {
            el.selectedIndex = 0;
        } else {
            el.value = '';
        }
    });

    ['vlan20', 'vlan30', 'vlan40', 'vlan50', 'vlan60'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    document.getElementById('vlan20').checked = true;
    document.getElementById('vlan40').checked = true;
    document.getElementById('vlan60').checked = true;

    const result = document.getElementById('wifi-resultado');
    if (result) {
        result.textContent = '—';
        result.style.display = 'none';
    }

    const wrap = document.getElementById(WIFI_IDENTIFICADOR_WRAP_ID);
    if (wrap) wrap.style.display = 'none';
}
