import { eqDados } from '../../shared/data/dados.js';

function eqFormatarPlano(nome) {
    return nome.charAt(0).toUpperCase() + nome.replace(/([a-z])([0-9])/g, '$1 $2').slice(1);
}

function eqPopular(sel, obj, def, fmt) {
    sel.innerHTML = `<option value="">${def}</option>`;
    Object.keys(obj).forEach((k) => {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = fmt ? fmt(k) : obj[k].nome;
        sel.appendChild(o);
    });
}

export function initEquipamentos() {
    const eqMod = document.getElementById('eq-modalidade');
    const eqVia = document.getElementById('eq-viabilidade');
    const eqPla = document.getElementById('eq-plano');
    const eqRes = document.getElementById('eq-resultado');

    if (!eqMod || !eqVia || !eqPla || !eqRes) return;

    eqPopular(eqMod, eqDados.modalidades, 'Selecione');

    eqMod.addEventListener('change', () => {
        eqVia.innerHTML = '<option value="">Selecione</option>';
        eqPla.innerHTML = '<option value="">Selecione</option>';
        eqVia.disabled = true;
        eqPla.disabled = true;
        eqRes.innerHTML = '<h3>Resultado</h3><p style="color:var(--text3);font-size:13px;">Selecione as opções acima.</p>';
        if (!eqMod.value) return;
        const vias = eqDados.modalidades[eqMod.value]?.viabilidades;
        if (vias && Object.keys(vias).length) {
            eqPopular(eqVia, vias, 'Selecione');
            eqVia.disabled = false;
        }
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
}
