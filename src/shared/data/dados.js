/* Regras do verificador de equipamentos */
export const eqDados = {
    modalidades: {
        dedicado: {
            nome: "Dedicado",
            viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)",
                    planos: {
                        "100-200mega": { equipamento: "F601 + RB750G3" },
                        "200-400mega": { equipamento: "F601 + RB3011" },
                        "500-1000mega": { equipamento: "F601 + RB4011" }
                    }
                },
                ptp: { nome: "Ponto-a-Ponto (PTP)", regraEspecial: "PTP-DEDICADO-01" }
            }
        },
        interlan: {
            nome: "Interconexão",
            viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)",
                    planos: {
                        "100-200mega": { equipamento: "F601 + RB750G3" },
                        "200-400mega": { equipamento: "F601 + RB3011" },
                        "500-1000mega": { equipamento: "F601 + RB4011" }
                    }
                },
                ptp: { nome: "Ponto-a-Ponto (PTP)", regraEspecial: "PTP-INTERLAN-01" }
            }
        },
        wifibussines: {
            nome: "Wifi-Bussines",
            viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)",
                    planos: {
                        "100-500mega": {
                            equipamento: "F601 + RB750G3 + AP(s) OMADA TPLINK",
                            obs: "Máximo de 3 APs; se precisar de mais, abrir tarefa com TI"
                        },
                        "500mega-700mega": {
                            equipamento: "F601 + RB3011 + AP(s) OMADA TPLINK",
                            obs: "Máximo de 3 APs; se precisar de mais, abrir tarefa com TI"
                        },
                        "1000mega": {
                            equipamento: "F601 + RB4011 + AP(s) OMADA TPLINK",
                            obs: "Máximo de 3 APs; se precisar de mais, abrir tarefa com TI"
                        }
                    }
                },
                ptp: { nome: "Ponto-a-Ponto (PTP)", regraEspecial: "PTP-BL-01" }
            }
        },
        bandalarga: {
            nome: "Banda Larga PF/PJ",
            viabilidades: {
                caixaDeAtendimentoGpon: {
                    nome: "Caixa de atendimento (GPON)",
                    planos: {
                        "100-600mega": { equipamento: "Tplink XC220-G3", mesh: "Tplink HC 220 — Wi-fi5" },
                        "100-600mega + adicional Wifi 6": {
                            equipamento: "ZTE ONT F6600",
                            mesh: "ZTE H3601",
                            obs: "Quatro portas GE LAN"
                        },
                        "600mega + telefonia": {
                            equipamento: "Tplink XC220-G3 + ATA Khomp",
                            mesh: "Tplink HC 220 — Wi-fi5",
                            obs: "Para linha(s) fixa(s) Unifique"
                        },
                        "600mega + 2serviçosUnifique": {
                            equipamento: "ZTE ONT F670L",
                            mesh: "ZTE H119A",
                            obs: "Necessário para uso de portas LAN"
                        },
                        "660mega-1000mega": {
                            equipamento: "ZTE ONT F6600",
                            mesh: "ZTE H3601",
                            obs: "Quatro portas GE LAN"
                        },
                        "2000-5000mega": {
                            equipamento: "ZTE ONT F8648P",
                            mesh: "ZTE H3601",
                            obs: "Uma porta 10GE"
                        }
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

