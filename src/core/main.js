// --- IMPORTAÇÃO DOS MÓDULOS ---
import { initEquipamentos } from '../features/equipamentos/equip.js';
import { novoToggleTipo, novoGerar, novoGerarSoRadius, novoGerarSoNtp, novoCopiar, novoLimpar } from '../features/acessos/novo-acesso.js';
import { wifiHotspotChange, wifiGerar, wifiCopiar, wifiLimpar, wifiCopiarWifeed, initWifi } from '../features/wifi/wifi.js';
import { ciascTrocar, ciascToggleNovaVlan, ciascAdicionarPorta, ciascRemoverPorta, ciascGerar, ciascCopiar, ciascLimpar } from '../features/ciasc/ciasc.js';
import { initIpv4, ipv4Calcular, ipv4Copiar, ipv4Limpar } from '../features/ipv4/ipv4.js';
import { initVplsEvento, vplsGerar, vplsCopiar, vplsLimpar } from '../features/vpls-evento/vpls-evento.js';

// --- SISTEMA DE NAVEGAÇÃO ---
function showPage(id, navEl) {
    const pageId = (typeof id === 'string' && id.startsWith('page-')) ? id : ('page-' + id);
    const pageEl = document.getElementById(pageId);
    if (!pageEl) {
        console.warn('showPage: página não encontrada', pageId);
        return;
    }

    // Remove a classe 'active' de todas as páginas e botões de navegação
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Adiciona 'active' na página atual e no botão clicado
    pageEl.classList.add('active');
    if (navEl && navEl.classList) navEl.classList.add('active');

    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* ignore */ }
}

window.showPage = showPage;


// --- INICIALIZAÇÃO E VINCULAÇÃO DE EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {

    // 1a. Inicializa o módulo do Verificador de Equipamentos
    initEquipamentos();

    // 1b. Inicializa o módulo da Calculadora IPv4 (popula o select de máscara)
    initIpv4();

    // 1c. Inicializa o módulo do Wifi Business (hosts calculados, VLANs adicionais, .rsc)
    initWifi();

    // 1d. Inicializa o módulo do VPLS Evento (preview dinâmico e portas cabeadas)
    initVplsEvento();

    // 2. Eventos de Navegação (Sidebar e Cards da Home)
    const navLinks = {
        'nav-home': 'home',
        'nav-novo': 'novo', // Ajuste o ID no HTML se necessário
        'nav-ciasc': 'ciasc',
        'nav-wifi': 'wifi',
        'nav-vpls-evento': 'vpls-evento',
        'nav-equip': 'equip',
        'nav-ipv4': 'ipv4'
    };

    // Vincula os botões da Sidebar
    Object.keys(navLinks).forEach(navId => {
        const btn = document.getElementById(navId);
        if (btn) {
            btn.addEventListener('click', function () {
                showPage(navLinks[navId], this);
            });
        }
    });

    // Vincula os atalhos (cards) da Home
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach(card => {
        card.addEventListener('click', function () {
            // Pega o destino com base no texto ou classe do card (pode ser ajustado via data-attributes no HTML)
            const title = this.querySelector('h3').textContent.toLowerCase();
            if (title.includes('novo acesso')) showPage('novo', document.getElementById('nav-novo'));
            if (title.includes('ciasc')) showPage('ciasc', document.getElementById('nav-ciasc'));
            if (title.includes('wifi')) showPage('wifi', document.getElementById('nav-wifi'));
            if (title.includes('vpls evento')) showPage('vpls-evento', document.getElementById('nav-vpls-evento'));
            if (title.includes('verificador')) showPage('equip', document.getElementById('nav-equip'));
            if (title.includes('ipv4')) showPage('ipv4', document.getElementById('nav-ipv4'));
        });
    });

    // Botões "Voltar ao início"
    document.querySelectorAll('.back-btn').forEach(btn => {
        // Ignora o botão de voltar da página de documentação (ele fará o retorno para o wifi)
        if (btn.id === 'btn-back-doc-wifi') return;

        btn.addEventListener('click', () => {
            showPage('home', document.getElementById('nav-home'));
        });
    });

    // 3. Eventos: Novo Acesso
    const novoTipoSelect = document.getElementById('novo-tipo');
    if (novoTipoSelect) novoTipoSelect.addEventListener('change', novoToggleTipo);

    const novoModeloSelect = document.getElementById('novo-modelo');
    if (novoModeloSelect) {
        // Ao trocar o Plano/Modelo, ele aciona a mesma lógica de toggle
        novoModeloSelect.addEventListener('change', novoToggleTipo);
    }

    document.querySelector('#page-novo .btn-primary')?.addEventListener('click', novoGerar);
    document.querySelector('#page-novo .btn-success')?.addEventListener('click', novoCopiar);
    document.querySelector('#page-novo .btn-danger')?.addEventListener('click', novoLimpar);

    // Botões secundários (Gerar só RADIUS / NTP)
    const btnSecondaryNovo = document.querySelectorAll('#page-novo .btn-secondary');
    if (btnSecondaryNovo.length >= 2) {
        btnSecondaryNovo[0].addEventListener('click', novoGerarSoRadius);
        btnSecondaryNovo[1].addEventListener('click', novoGerarSoNtp);
    }


    // 4. Eventos: Wifi Business
    const wifiMamboSelect = document.getElementById('wifi-mambo');
    if (wifiMamboSelect) wifiMamboSelect.addEventListener('change', wifiHotspotChange);

    document.querySelector('#page-wifi .btn-primary')?.addEventListener('click', wifiGerar);
    document.querySelector('#page-wifi .btn-success')?.addEventListener('click', wifiCopiar);
    document.querySelector('#page-wifi .btn-danger')?.addEventListener('click', wifiLimpar);

    document.getElementById('wifi-copiar-wifeed')?.addEventListener('click', wifiCopiarWifeed);


    // 5. Eventos: CIASC
    const ciascTipoSelect = document.getElementById('ciasc-tipo');
    if (ciascTipoSelect) ciascTipoSelect.addEventListener('change', ciascTrocar);

    const ciascNovaVlanCheckbox = document.getElementById('ciasc-novaVlan');
    if (ciascNovaVlanCheckbox) ciascNovaVlanCheckbox.addEventListener('change', ciascToggleNovaVlan);

    // Botão adicionar porta CIASC
    document.querySelector('#ciasc-blocoVPLS .btn-secondary')?.addEventListener('click', ciascAdicionarPorta);

    // Delegação de evento para o botão de Remover Porta CIASC (pois elas são criadas dinamicamente)
    const containerPortas = document.getElementById('ciasc-portasContainer');
    if (containerPortas) {
        containerPortas.addEventListener('click', function (e) {
            // Verifica se o clique foi em um botão com a classe btn-danger
            if (e.target && e.target.classList.contains('btn-danger')) {
                ciascRemoverPorta(e.target);
            }
        });
    }

    document.querySelector('#ciasc-btnRow .btn-primary')?.addEventListener('click', ciascGerar);
    document.querySelector('#ciasc-btnRow .btn-success')?.addEventListener('click', ciascCopiar);
    document.querySelector('#ciasc-btnRow .btn-danger')?.addEventListener('click', ciascLimpar);

    const btnShowDoc = document.getElementById('btn-show-doc-wifi');
    if (btnShowDoc) {
        btnShowDoc.addEventListener('click', () => {
            // Vai para a página de documentação e mantém o botão "Wifi" aceso no menu lateral
            showPage('doc-wifi', document.getElementById('nav-wifi'));
        });
    }

    const btnBackDoc = document.getElementById('btn-back-doc-wifi');
    if (btnBackDoc) {
        btnBackDoc.addEventListener('click', () => {
            // Volta para o gerador de Wifi e mantém o botão aceso
            showPage('wifi', document.getElementById('nav-wifi'));
        });
    }

    // 6. Eventos: Calculadora IPv4
    document.querySelector('#page-ipv4 .btn-primary')?.addEventListener('click', ipv4Calcular);
    document.querySelector('#page-ipv4 .btn-success')?.addEventListener('click', ipv4Copiar);
    document.querySelector('#page-ipv4 .btn-danger')?.addEventListener('click', ipv4Limpar);

    // 7. Eventos: VPLS Evento
    document.querySelector('#page-vpls-evento .btn-row .btn-primary')?.addEventListener('click', vplsGerar);
    document.querySelector('#page-vpls-evento .btn-row .btn-success')?.addEventListener('click', vplsCopiar);
    document.querySelector('#page-vpls-evento .btn-row .btn-danger')?.addEventListener('click', vplsLimpar);

});