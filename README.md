# Painel de Ferramentas — CRC

MVP (em homologação) de um painel web para centralizar ferramentas do setor, usado para provisionar acessos, gerar scripts de rede e consultar equipamentos recomendados por modalidade/plano.

Projeto 100% front-end (HTML + CSS + JavaScript puro), sem backend, sem build e sem dependências externas. Todo o processamento acontece no navegador.

## Status

🚧 **MVP em homologação** — em validação com o setor antes de virar versão estável.

## Estrutura de arquivos

```
mvp-painel-CRC/
├── index.html                        # Estrutura das páginas e formulários
├── src/
│   ├── core/
│   │   └── main.js                   # Navegação entre páginas e wiring dos eventos
│   ├── features/
│   │   ├── acessos/novo-acesso.js     # Lógica do Novo Acesso
│   │   ├── ciasc/ciasc.js             # Lógica das Ferramentas CIASC
│   │   ├── wifi/wifi.js               # Lógica do Wifi Business
│   │   ├── equipamentos/equip.js      # Lógica do Verificador de Equipamentos
│   │   └── ipv4/ipv4.js               # Lógica da Calculadora de Redes IPv4
│   └── shared/
│       ├── data/dados.js             # Dados estáticos (ex.: equipamentos por plano)
│       └── styles/style.css          # Estilos (tema, layout, componentes)
└── README.md                          # Este arquivo
```

## Como rodar

Não é necessário instalar nada. Basta abrir o `index.html` diretamente no navegador, ou servir a pasta com um servidor estático simples, por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Funcionalidades

### 🏠 Início
Página inicial com cards de atalho para cada ferramenta.

### 🔌 Novo Acesso
Ferramenta unificada para provisionar um equipamento novo. Gera, a partir de um único formulário:
- **Identity** (nome do dispositivo)
- **RADIUS** (incluindo DNS e service)
- **NTP** (com opções para RouterOS v6 e v7)

Suporta modelos **Dedicado/Banda Larga** e **Interconexão**, e tipos de acesso **GPON** e **PTP**, com campos específicos para cada caso (SN/MAC da ONU no GPON; switches e IP remoto no PTP). Também é possível gerar apenas o bloco de RADIUS ou apenas o de NTP.

### 🛠️ Ferramentas CIASC
Duas sub-ferramentas selecionáveis:
- **Gerador de script de sub-interfaces (VLANs) + QoS**, com suporte a múltiplas portas TAGG, VLANs pré-definidas e criação de VLANs/pseudo-wires novos.
- **Gerador de observação de cadastro CIASC — ZXR10**, a partir de SN da ONU, IP de gerência, IP de loopback e VLANs selecionadas.

### 📶 Wifi Business
Gerador modular de scripts MikroTik, com:
- Escolha de AP para adoção (TP-Link/Omada ou Ubiquiti/UniFi, ou nenhum)
- Ativação opcional de Hotspot (Wifeed ou Mambo, com identificador obrigatório para Mambo)
- Seleção de VLANs a provisionar na Bridge-LAN (Hotspot, Máquina de Cartão, Corporativo, Reserva, Gerência)

### 📋 Verificador de Equipamentos
Consulta em cascata (Modalidade → Viabilidade → Plano) que retorna o equipamento recomendado, com observações e, quando aplicável, alerta de regra especial (ex.: acessos PTP que dependem de projeto de engenharia).

As regras desta ferramenta ficam no objeto `eqDados`, dentro de `src/shared/data/dados.js`, e podem ser atualizadas ali conforme o portfólio de equipamentos mudar.

### 🧮 Calculadora de Redes IPv4
Calculadora de sub-redes IPv4, inspirada na ferramenta do site24x7:
- Informe o **Endereço de Rede** e a **Máscara de Sub-rede** (lista de `/0` a `/32`) para calcular faixa de host, broadcast, máscara curinga e notação CIDR.
- Divida a rede em múltiplas sub-redes informando **Nº de Sub-redes Desejado** ou **Hosts Necessários por Sub-rede** (apenas um dos dois) — o resultado exibe uma tabela com **Detalhes da Sub-rede** (Subnet ID, endereço, faixa de host e broadcast) para cada sub-rede gerada, com limite de 256 linhas exibidas por segurança/performance.
- Traz um tutorial recolhível ("Como usar esta calculadora") explicando o preenchimento dos campos.

## Todas as ferramentas oferecem

- Botão **Gerar/Calcular** para montar o texto/script ou o resultado do cálculo
- Botão **Copiar** para copiar o resultado para a área de transferência (com mensagem de confirmação)
- Botão **Limpar/Novo** para reiniciar o formulário

## Tecnologias

- HTML5
- CSS3 (variáveis CSS para tema/cores)
- JavaScript (vanilla, sem frameworks)

## Próximos passos sugeridos

- [ ] Validar regras de negócio de cada ferramenta com o setor responsável
- [ ] Definir processo de atualização dos dados de equipamentos/planos
- [ ] Avaliar necessidade de persistência (histórico de gerações) e/ou backend
- [ ] Testes em diferentes navegadores/resoluções antes da versão estável
