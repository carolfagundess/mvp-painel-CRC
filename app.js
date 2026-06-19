/* ══ NAVEGAÇÃO ══ */
function showPage(id, navEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if (navEl) navEl.classList.add('active');
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