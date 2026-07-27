const CIASC_NOMES = { 650: 'CAMERAS', 690: 'VOIP', 903: 'GERENCIA', 601: 'SED', 602: 'SSS', 603: 'SSE', 604: 'HOTSPOT', 605: 'SUA', 606: 'INET', 999: 'TRANSIT-DC' };

export function ciascTrocar() {
    const t = document.getElementById('ciasc-tipo').value;
    document.getElementById('ciasc-blocoVPLS').classList.add('hidden');
    document.getElementById('ciasc-blocoCadastro').classList.add('hidden');
    document.getElementById('ciasc-btnRow').style.display = 'none';
    document.getElementById('ciasc-resultado').style.display = 'none';
    if (t === 'vpls') document.getElementById('ciasc-blocoVPLS').classList.remove('hidden');
    if (t === 'cadastro') document.getElementById('ciasc-blocoCadastro').classList.remove('hidden');
    if (t) document.getElementById('ciasc-btnRow').style.display = 'flex';
}

export function ciascToggleNovaVlan() {
    document.getElementById('ciasc-blocoNovaVlan').classList.toggle('hidden', !document.getElementById('ciasc-novaVlan').checked);
}

export function ciascAdicionarPorta() {
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
<button class="btn btn-danger" style="margin-top:12px;font-size:12px;padding:7px 14px;">Remover Porta</button>`;
    c.appendChild(d);
}

export function ciascRemoverPorta(btn) {
    const blocos = document.querySelectorAll('#ciasc-portasContainer .porta-bloco');
    if (blocos.length === 1) {
        alert('Mantenha ao menos uma porta.');
        return;
    }
    btn.parentElement.remove();
}

export function ciascGerar() {
    const tipo = document.getElementById('ciasc-tipo').value;
    if (tipo === 'vpls') ciascGerarVPLS();
    if (tipo === 'cadastro') ciascGerarCadastro();
}

function ciascGerarCadastro() {
    const sn = document.getElementById('ciasc-snonu').value.trim().toUpperCase();
    const ger = document.getElementById('ciasc-gerencia').value.trim();
    const lb = document.getElementById('ciasc-loopback').value.trim();
    if (!sn || !ger || !lb) {
        alert('Preencha todos os campos!');
        return;
    }
    const vlans = [...document.querySelectorAll('#ciasc-blocoCadastro input[type=checkbox]:checked')].map((x) => x.value);
    const r = document.getElementById('ciasc-resultado');
    r.style.display = 'block';
    r.textContent = `${sn} | ZTE ZXR10 | ${ger} | ${lb} | VLANS: ${vlans.join(' / ')}`;
}

function ciascGerarVPLS() {
    const blocos = document.querySelectorAll('#ciasc-portasContainer .porta-bloco');
    let res = '';
    const precisaNova = document.getElementById('ciasc-novaVlan').checked;

    // CAPTURA A NOVA REGRA DE ENLACE
    const vlanEnlace = document.getElementById('ciasc-vlanEnlace').value;
    const neighbour = vlanEnlace === '3042' ? '198.20.0.254' : '198.18.0.254';

    if (precisaNova) {
        const novas = [...document.querySelectorAll('#ciasc-blocoNovaVlan input[type=checkbox]:checked')].map((x) => x.value);
        if (novas.length > 0) {
            res += '__________NOVAS VLANS / PSEUDO-WIRES__________\n\n\n';
            novas.forEach((v) => {
                // Substitui IP hardcoded pela variável ${neighbour}
                res += `pw pw${v}1\nvpls VPLS-${v}-${CIASC_NOMES[v]}\n  mtu 1508\n  pseudo-wire pw${v}1\n    neighbour ${neighbour} vcid 700${v}\n      encapsulation tagged\n    $\n  $\n$\n\n`;
            });
        }
    }

    blocos.forEach((bloco) => {
        const porta = bloco.querySelector('.portaTagg').value;
        const vlans = [...bloco.querySelectorAll('.vlans-grid input[type=checkbox]:checked')];
        if (vlans.length > 0) res += `__________CONFIGURAÇÃO SUB-INTERFACES - ${porta}__________\n\n\n`;
        vlans.forEach((vlan) => {
            res += `####VLAN${vlan.value}####\n\ninterface ${porta}.${vlan.value}\nexit\nvlan-configuration\ninterface ${porta}.${vlan.value}\nencapsulation-dot1q ${vlan.value}\nexit\nexit\n\nvpls VPLS-${vlan.value}-${CIASC_NOMES[vlan.value]}\n  access-point ${porta}.${vlan.value}\n    access-params ethernet\n\n\n`;
        });
    });

    res += '\n\n__________CONFIGURAÇÃO QOS__________\n\n\n!<car>\nqos\n';

    blocos.forEach((bloco) => {
        const porta = bloco.querySelector('.portaTagg').value;
        [...bloco.querySelectorAll('.vlans-grid input[type=checkbox]:checked')].forEach((vlan) => {
            res += `  interface ${porta}.${vlan.value}\n    rate-limit input broadcast cir 100 kbps cbs 16000 pir 2000 kbps pbs 3200 conform-action transmit exceed-action drop violate-action drop\n  $\n`;
        });
    });

    // Substitui o 4042 hardcoded pela variável ${vlanEnlace}
    res += `  interface gei-0/10.${vlanEnlace}\n    no rate-limit input qos-group 1\n    no rate-limit output qos-group 1\n    rate-limit input outer-vlan ${vlanEnlace} cir 100 mbps cbs 100000 pir 100 mbps pbs 2000 conform-action transmit exceed-action drop violate-action drop\n    rate-limit output outer-vlan ${vlanEnlace} cir 100 mbps cbs 100000 pir 100 mbps pbs 2000 conform-action transmit exceed-action drop violate-action drop\n\n  $\n$\n!</car>`;

    const r = document.getElementById('ciasc-resultado');
    r.style.display = 'block';
    r.textContent = res;
}

export function ciascCopiar() {
    const t = document.getElementById('ciasc-resultado').textContent;
    if (t === '—') {
        alert('Nada para copiar!');
        return;
    }
    navigator.clipboard.writeText(t);
    const m = document.getElementById('ciasc-copiado');
    m.style.display = 'block';
    setTimeout(() => {
        m.style.display = 'none';
    }, 1800);
}

export function ciascLimpar() {
    document.getElementById('ciasc-tipo').selectedIndex = 0;
    document.getElementById('ciasc-blocoVPLS').classList.add('hidden');
    document.getElementById('ciasc-blocoCadastro').classList.add('hidden');
    document.getElementById('ciasc-btnRow').style.display = 'none';
    document.getElementById('ciasc-resultado').style.display = 'none';
    document.getElementById('ciasc-resultado').textContent = '—';
    document.getElementById('ciasc-copiado').style.display = 'none';

    document.getElementById('ciasc-novaVlan').checked = false;
    document.getElementById('ciasc-blocoNovaVlan').classList.add('hidden');
    document.querySelectorAll('#ciasc-blocoNovaVlan input[type=checkbox]').forEach((cb) => cb.checked = false);

    const container = document.getElementById('ciasc-portasContainer');
    const blocos = container.querySelectorAll('.porta-bloco');
    
    // Reset do seletor de Enlace InterLAN
    const selectEnlace = document.getElementById('ciasc-vlanEnlace');
    if (selectEnlace) selectEnlace.selectedIndex = 0;
    
    blocos.forEach((bloco, i) => {
        if (i > 0) bloco.remove();
    });

    const primeiroBoco = container.querySelector('.porta-bloco');
    if (primeiroBoco) {
        primeiroBoco.querySelector('.portaTagg').selectedIndex = 0;
        primeiroBoco.querySelectorAll('input[type=checkbox]').forEach((cb) => cb.checked = false);
    }

    document.getElementById('ciasc-snonu').value = '';
    document.getElementById('ciasc-gerencia').value = '';
    document.getElementById('ciasc-loopback').value = '';
    document.querySelectorAll('#ciasc-blocoCadastro input[type=checkbox]').forEach((cb) => cb.checked = false);
}