# Sistema CRC — Regras de Negócio & Arquitetura MVP
**Configuração e Relacionamento Corporativo**
*Versão 1.0 — Documento de Referência*

---

## 1. Contexto do Setor

O setor CRC atua no segmento B2B, responsável por configuração de links e serviços para clientes corporativos, governos e projetos de grande escala. Os analistas do CRC realizam, entre outras atividades, geração de scripts de infraestrutura, documentação de clientes e consulta de viabilidade técnica.

---

## 2. Ferramentas Mapeadas no MVP Atual

O arquivo `painel-CRC.html` já contém três ferramentas funcionais e dois itens planejados:

### 2.1 Ferramentas Ativas

| # | Ferramenta | Categoria | Função Principal |
|---|-----------|-----------|-----------------|
| 1 | **Gerador Identity — RB** | Documentação de Cliente | Gera strings de identidade no padrão `CUST-RB-[TIPO]-[CIDADE]-[CLIENTE]-[CIRCUITO]-[NOME]` para clientes Dedicado, Banda Larga e Interconexão |
| 2 | **Ferramentas CIASC** | Infraestrutura | Gerador de scripts VPLS + QoS e observação de cadastro para equipamento ZXR10 (ZTE) |
| 3 | **Verificador de Equipamentos** | Pré-venda / Campo | Consulta o equipamento correto por modalidade (Dedicado, Interconexão, Wifi Business, Banda Larga), viabilidade (GPON, PTP) e faixa de plano |

### 2.2 Ferramentas Planejadas (Em breve)

| # | Ferramenta | Categoria |
|---|-----------|-----------|
| 4 | **NTP Server** | Infraestrutura |
| 5 | **Acesso RADIUS** | Infraestrutura |

---

## 3. Regras de Negócio por Ferramenta

### 3.1 Gerador Identity — RB

**Objetivo:** Padronizar a geração do identificador de roteador por cliente, eliminando erros manuais de digitação.

**Regras:**

- **RN-ID-01:** O modelo "Dedicado / Banda Larga" gera o padrão:
  `CUST-RB-{TIPO}-{CIDADE}-{COD_CLIENTE}-{COD_CIRCUITO}-{NOME}`
- **RN-ID-02:** O modelo "Interconexão" inclui o campo **Local** no padrão:
  `CUST-RB-{TIPO}-{LOCAL}-{CIDADE}-{COD_CLIENTE}-{COD_CIRCUITO}-{NOME}`
- **RN-ID-03:** O campo **Local** só é exibido quando o modelo "Interconexão" está selecionado.
- **RN-ID-04:** A sigla da cidade deve ser inserida em maiúsculas (sistema converte automaticamente).
- **RN-ID-05:** O nome do cliente é normalizado: maiúsculas, sem acentos, espaços substituídos por `_`, caracteres especiais removidos.
- **RN-ID-06:** Todos os campos são obrigatórios para gerar a string.
- **RN-ID-07:** O tipo pode ser **GPON** ou **PTP**.
- **RN-ID-08:** O campo Local pode ser **FL** (Filial) ou **CONC** (Concentrador).

---

### 3.2 Ferramentas CIASC

**Objetivo:** Gerar scripts prontos para aplicação em switches ZXR10 (ZTE) do parceiro CIASC, eliminando digitação manual de configurações de rede.

#### 3.2.1 Gerador VPLS + Sub-interfaces + QoS

**Regras:**

- **RN-CIASC-01:** O analista seleciona uma ou mais portas TAGG (`gei-0/1` a `gei-0/4`) e marca as VLANs associadas a cada porta.
- **RN-CIASC-02:** VLANs disponíveis: `650 (CAMERAS)`, `690 (VOIP)`, `903 (GERENCIA)`, `601 (SED)`, `602 (SSS)`, `603 (SSE)`, `604 (HOTSPOT)`, `605 (SUA)`, `606 (INET)`, `999 (TRANSIT-DC)`.
- **RN-CIASC-03:** O script gerado segue três blocos na ordem:
  1. **Novas VLANs / Pseudo-wires** (opcional — só quando marcado)
  2. **Configuração de Sub-interfaces** por porta/VLAN
  3. **Configuração QoS** para todas as sub-interfaces geradas
- **RN-CIASC-04:** O padrão de pseudo-wire usa `neighbour 198.18.0.254` e `vcid 700{VLAN}`.
- **RN-CIASC-05:** O QoS aplica rate-limit de `100 kbps CIR / 2000 kbps PIR` em broadcast para cada sub-interface.
- **RN-CIASC-06:** É possível adicionar múltiplos blocos de porta; o sistema deve manter ao menos um bloco de porta (não permitir remover o último).

#### 3.2.2 Gerador de Observação de Cadastro — ZXR10

**Regras:**

- **RN-CIASC-07:** Campos obrigatórios: SN da ONU, IP de Gerência, IP Loopback.
- **RN-CIASC-08:** O SN é convertido para maiúsculas automaticamente.
- **RN-CIASC-09:** Gera uma linha de observação no formato:
  `{SN} | ZTE ZXR10 | {IP_GERENCIA} | {IP_LOOPBACK} | VLANS: {lista_vlans}`

---

### 3.3 Verificador de Equipamentos

**Objetivo:** Indicar o kit de equipamentos correto para instalação, conforme modalidade de serviço, tipo de viabilidade e faixa de plano.

**Regras:**

- **RN-EQ-01:** A seleção é em cascata: Modalidade → Viabilidade → Plano.
- **RN-EQ-02:** Modalidades disponíveis: **Dedicado**, **Interconexão**, **Wifi Business**, **Banda Larga PF/PJ**.
- **RN-EQ-03:** Viabilidades disponíveis: **Caixa de atendimento (GPON)** e **Ponto-a-Ponto (PTP)**.
- **RN-EQ-04:** Para qualquer modalidade com viabilidade PTP, o resultado é um alerta indicando que o projeto depende da engenharia — não há seleção de plano.
- **RN-EQ-05:** Para GPON, o resultado inclui: equipamento principal, mesh (quando aplicável) e observações especiais (quando aplicável).
- **RN-EQ-06 (Wifi Business):** Máximo de 3 APs sem abertura de tarefa com TI. Acima disso, abertura de tarefa é obrigatória.
- **RN-EQ-07 (Banda Larga + Telefonia):** Requer ATA Khomp para linhas fixas Unifique.
- **RN-EQ-08 (Banda Larga + 2 serviços Unifique):** Exige ONT ZTE F670L com portas LAN.

---

## 4. Arquitetura do MVP

### 4.1 Visão Geral

O sistema é uma **Single Page Application (SPA)** executada no navegador, sem backend, sem banco de dados e sem autenticação no MVP. Toda a lógica reside no frontend.

```
┌─────────────────────────────────────────────────────┐
│                  PAINEL CRC (SPA)                    │
│                                                     │
│  ┌──────────┐  ┌───────────────────────────────┐   │
│  │ Sidebar  │  │         Área de Conteúdo       │   │
│  │ Navegação│  │                               │   │
│  │          │  │  ┌─────────────────────────┐  │   │
│  │ • Início │  │  │     Ferramenta Ativa    │  │   │
│  │ • Doc.   │  │  │  (formulário + output)  │  │   │
│  │ • Infra  │  │  └─────────────────────────┘  │   │
│  └──────────┘  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 4.2 Estrutura de Arquivos (MVP Fase 1)

```
/painel-crc/
├── index.html          ← Estrutura principal (topbar, sidebar, roteamento)
├── styles/
│   └── main.css        ← Design system (variáveis, componentes reutilizáveis)
├── modules/
│   ├── identity.js     ← Lógica do Gerador Identity
│   ├── ciasc.js        ← Lógica das Ferramentas CIASC
│   └── equipamentos.js ← Lógica do Verificador de Equipamentos
├── data/
│   ├── equipamentos.json  ← Base de dados de equipamentos por modalidade/plano
│   └── vlans.json         ← Mapeamento de VLANs e nomes
└── pages/
    ├── home.html       ← Grid de cards
    ├── identity.html   ← Formulário Identity
    ├── ciasc.html      ← Formulários CIASC
    └── equip.html      ← Verificador de Equipamentos
```

> **Nota:** No MVP imediato, pode permanecer em arquivo único (`index.html`) para facilitar distribuição como arquivo local. A separação em módulos é recomendada quando houver servidor.

### 4.3 Categorias de Ferramentas (Roadmap)

| Categoria | Descrição | Status |
|-----------|-----------|--------|
| **Documentação de Cliente** | Geração de strings, identidades, observações padronizadas | ✅ Ativo |
| **Infraestrutura** | Scripts de configuração de rede, switches, VLANs | ✅ Parcial |
| **Consulta Técnica** | Verificadores de equipamento, viabilidade, topologia | ✅ Ativo |
| **Infraestrutura NTP** | Configuração de servidores NTP | 🔜 Planejado |
| **Acesso RADIUS** | Geração de credenciais | 🔜 Planejado |
| **Relatórios** | Geração de relatórios de atendimento/processo | 📋 A mapear |
| **Scripts Adicionais** | Novos geradores conforme demanda do setor | 📋 A mapear |

---

## 5. Requisitos do Sistema

### 5.1 Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| RF-01 | O sistema deve centralizar todas as ferramentas do setor em uma única interface |
| RF-02 | Cada ferramenta deve ser acessível via menu lateral e via cards na tela inicial |
| RF-03 | Todo output gerado deve poder ser copiado para a área de transferência com um clique |
| RF-04 | O sistema deve validar campos obrigatórios antes de gerar qualquer resultado |
| RF-05 | Deve ser possível limpar/resetar qualquer ferramenta sem recarregar a página |
| RF-06 | Novas ferramentas devem ser adicionadas de forma incremental sem quebrar as existentes |
| RF-07 | Ferramentas em desenvolvimento devem ser exibidas como "Em breve" com visual desabilitado |

### 5.2 Requisitos Não-Funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | O sistema deve funcionar como arquivo local (sem servidor) no MVP |
| RNF-02 | Deve carregar em menos de 2 segundos em máquinas da equipe |
| RNF-03 | Interface responsiva para resolução mínima de 1280×720px |
| RNF-04 | Nenhuma dependência externa (bibliotecas CDN) para garantir funcionamento offline |
| RNF-05 | Código organizado por módulos/seções com comentários claros para facilitar manutenção solo |

### 5.3 Requisitos Futuros (Pós-MVP)

| ID | Requisito | Observação |
|----|-----------|-----------|
| RF-F01 | Disponibilização via web (intranet ou internet) | Requer alinhamento com gestão |
| RF-F02 | Autenticação de usuários | Necessário ao disponibilizar via rede |
| RF-F03 | Histórico de gerações por analista | Requer backend/storage |
| RF-F04 | Integração com sistemas internos | A definir conforme necessidade |

---

## 6. Próximos Passos

### Fase 1 — MVP (Atual)
- [x] Mapear ferramentas existentes
- [x] Documentar regras de negócio
- [ ] Consolidar em arquivo único organizado
- [ ] Adicionar ferramentas pendentes do backlog do setor

### Fase 2 — Expansão
- [ ] Levantar lista completa de processos manuais do setor
- [ ] Priorizar por frequência de uso e dor do analista
- [ ] Implementar ferramentas em ordem de prioridade

### Fase 3 — Infraestrutura (se aprovado)
- [ ] Definir ambiente de hospedagem (intranet vs. internet)
- [ ] Avaliar necessidade de backend (autenticação, histórico, relatórios)
- [ ] Apresentar proposta formal para gestão

---

## 7. Glossário

| Termo | Definição |
|-------|-----------|
| **CRC** | Configuração e Relacionamento Corporativo |
| **CIASC** | Parceiro/provedor de infraestrutura de rede |
| **VPLS** | Virtual Private LAN Service — tecnologia de VPN de camada 2 |
| **ZXR10** | Modelo de switch ZTE utilizado na infraestrutura |
| **ONU** | Optical Network Unit — equipamento do cliente na fibra óptica |
| **VLAN** | Virtual LAN — segmentação lógica de rede |
| **QoS** | Quality of Service — controle de qualidade e priorização de tráfego |
| **PTP** | Point-to-Point — tipo de viabilidade de link |
| **GPON** | Gigabit Passive Optical Network — tipo de viabilidade via fibra |
| **SPA** | Single Page Application — sistema web de página única |
| **Identity** | String de identidade padrão para identificação do roteador do cliente |
| **RADIUS** | Protocolo de autenticação para acesso à rede |
