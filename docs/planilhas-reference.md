# 📊 Documentação de Referência: Sistema de Planilhas

## Visão Geral

Este documento descreve a estrutura de dados das planilhas de anúncios do Google Ads e Meta Ads, usadas no dashboard ADS Analytics.

---

## 🔵 Google Ads

### Estrutura de Dados

Os dados do Google são exportados como **relatórios semanais por conta**, onde cada linha representa uma **semana ISO (Seg-Dom)**.

```
📁 planilhas/google/
├── kia-google-nov.csv       ← Período: Novembro 2025
├── suzuki-google-nov.csv    ← Período: Novembro 2025
├── kia-google-out.csv       ← Período: Outubro 2025
├── suzuki-google-out.csv    ← Período: Outubro 2025
└── ...
```

### Formato do CSV (Linha 1-3)

```csv
Relatório de campanha                         ← Título
1 de novembro de 2025 - 30 de novembro de 2025 ← Período do relatório (metadata)
Semana,Status da campanha,Campanha,...        ← Headers das colunas
```

### ⚠️ Regra Crítica: Ciclo de Semanas ISO

> [!IMPORTANT]
> **Os dados do Google usam semanas ISO (Segunda a Domingo)**.
> Isso significa que um relatório de "Novembro" pode conter datas de **outubro** e **dezembro**!

#### Exemplo Real: `kia-google-nov.csv`

| Semana (Seg) | Dias Cobertos | Observação |
|---|---|---|
| 2025-10-27 | 27/out - 02/nov | **Semana inicia em outubro!** |
| 2025-11-03 | 03/nov - 09/nov | Semana completa de novembro |
| 2025-11-10 | 10/nov - 16/nov | Semana completa de novembro |
| 2025-11-17 | 17/nov - 23/nov | Semana completa de novembro |
| 2025-11-24 | 24/nov - 30/nov | Semana termina em novembro |

**Período real dos dados:** `2025-10-27` até `2025-11-30` (não 01/11!)

### Colunas Principais

| Coluna | Tipo | Descrição |
|---|---|---|
| `Semana` | `YYYY-MM-DD` | Data da segunda-feira da semana |
| `Campanha` | string | Nome da campanha (ex: `[PMAX]_sportage`) |
| `Status da campanha` | string | `Ativada`, `Pausada`, etc. |
| `Orçamento` | decimal | Orçamento diário configurado |
| `Tipo de estratégia de lances` | string | Ex: `Maximizar as conversões` |
| `Custo` | decimal | Gasto total na semana (BRL) |
| `Conversões` | decimal | Número de conversões |
| `Impr.` | integer | Impressões |
| `Cliques` | integer | Cliques totais |
| `CPC méd.` | decimal | Custo por clique médio |

### Lógica de Agregação

```
┌─────────────────────────────────────────────────────────────┐
│  Google: UMA LINHA = UMA SEMANA COMPLETA (já agregada)      │
│                                                             │
│  Semana 2025-10-27 → Custo: R$ 155,93 (soma de Seg-Dom)    │
│  Semana 2025-11-03 → Custo: R$ 555,06 (soma de Seg-Dom)    │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔷 Meta Ads (Facebook/Instagram)

### Estrutura de Dados

Os dados da Meta são exportados como **relatórios diários granulares**, onde cada linha representa:
- Um **único dia** 
- Segmentado por **idade** e **gênero**

```
📁 planilhas/meta/
├── relatorio-meta-nov.csv   ← Novembro 2025 (11.726 linhas!)
├── relatorio-meta-out.csv   ← Outubro 2025
└── ...
```

### Formato do CSV

```csv
"Nome da conta","Nome da campanha",...,"Dia","Valor usado (BRL)",...
"Conta Kia Sun Motors","CP06_bongo_...",...,"2025-11-30",0.04,...
"Conta Haojue Sun Motors","CP04_dr-160_...",...,"2025-11-30",0.96,...
```

### Regra de Período

> [!NOTE]
> **Meta usa dias exatos do mês calendário**.
> Um relatório de "Novembro" cobre exatamente `2025-11-01` até `2025-11-30`.

### Colunas Principais

| Coluna | Tipo | Descrição |
|---|---|---|
| `Nome da conta` | string | Ex: `Conta Kia Sun Motors` |
| `Nome da campanha` | string | Ex: `CP06_bongo_[inicio_01/01]` |
| `Nome do conjunto de anúncios` | string | Nome do ad set |
| `Nome do anúncio` | string | Nome do criativo |
| `Dia` | `YYYY-MM-DD` | Data exata do registro |
| `Idade` | string | Faixa etária: `18-24`, `25-34`, etc. |
| `Gênero` | string | `male`, `female`, `unknown` |
| `Valor usado (BRL)` | decimal | Gasto naquele dia/segmento |
| `Leads` | integer | Leads gerados |
| `Cliques no link` | integer | Cliques no link |
| `Impressões` | integer | Impressões |
| `Orçamento da campanha` | decimal | Orçamento configurado |

### Lógica de Agregação

```
┌─────────────────────────────────────────────────────────────┐
│  Meta: MÚLTIPLAS LINHAS = UM DIA (granular)                 │
│                                                             │
│  Dia 2025-11-30:                                            │
│    └── Kia, 18-24, female  → R$ 0,04                       │
│    └── Kia, 18-24, male    → R$ 0,36                       │
│    └── Kia, 25-34, female  → R$ 0,12                       │
│    └── Kia, 25-34, male    → R$ 0,45                       │
│    └── ... (centenas de linhas por dia)                     │
│                                                             │
│  ► Para Visualização DIÁRIA: Somar por Dia                  │
│  ► Para Visualização SEMANAL: Agrupar por segunda-feira     │
│    (usando função getWeekStart())                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Comparação de Períodos

### Problema: Meses Não São Iguais Entre Plataformas!

| Mês | Google (Período Real) | Meta (Período Real) |
|---|---|---|
| **Novembro 2025** | 27/10/2025 - 30/11/2025 | 01/11/2025 - 30/11/2025 |
| **Outubro 2025** | 29/09/2025 - 02/11/2025 | 01/10/2025 - 31/10/2025 |
| **Junho 2025** | 26/05/2025 - 06/07/2025 | 01/06/2025 - 30/06/2025 |

### Implicação no Dashboard

> [!CAUTION]
> Ao alternar entre plataformas, o `dateRange` **deve ser recalculado** com base nos dados reais daquela plataforma, não no calendário.

```
Google Nov → dateRange: 27/10 a 30/11 (dados reais da planilha)
Meta Nov   → dateRange: 01/11 a 30/11 (mês calendário)
```

---

## 🔧 Funções de Tratamento no Código

### Para Google

```typescript
// utils/googleDatasetGrouping.ts
getGoogleGroupDateRange(group) → obtém min/max dates dos dados reais
```

### Para Meta

```typescript
// utils/aggregation.ts
getWeekStart(dateStr)           → calcula segunda-feira da semana ISO
calculateDailyBreakdown(items)  → agrupa por dia
calculateWeeklyBreakdown(items) → agrupa por semana (usando getWeekStart)
```

---

## 📋 Resumo de Diferenças

| Aspecto | Google Ads | Meta Ads |
|---|---|---|
| **Granularidade** | Semanal (Seg-Dom) | Diária + Idade + Gênero |
| **Linhas por mês** | ~5-6 por campanha | Milhares (granular) |
| **Período do mês** | Pode iniciar em mês anterior | Exato (01 a 30/31) |
| **Agregação necessária** | Nenhuma (já vem agregado) | Somar por dia ou semana |
| **Coluna de data** | `Semana` (segunda-feira) | `Dia` (data exata) |
| **Limpeza de nome** | Não necessária | Remove "Conta" e "Sun Motors" |
