<div align="center">
  <img width="300" alt="TOPSTACK Logo" src="https://pvlobuvyblzcielydbum.supabase.co/storage/v1/object/public/topstack/topstack-logo-3x1.png" />
</div>

# ADS Analytics

Dashboard unificado para análise e comparação de performance de campanhas publicitárias do **Meta Ads** e **Google Ads**. Visualize métricas, compare períodos e otimize seus investimentos em marketing digital.

---

## 🚀 Desenvolvido por TOPSTACK

**O futuro pertence a quem transforma tecnologia em vantagem.**

A TOPSTACK conecta inovação e propósito, criando soluções personalizadas, automações e software sob medida que liberam o seu potencial. Fazemos a tecnologia trabalhar por você: eliminamos tarefas repetitivas, otimizamos o marketing digital e entregamos business intelligence para decisões claras e seguras.

Com nossos projetos, você ganha tempo, reduz custos e cresce com previsibilidade.

### 📋 Nossos Serviços

- ✅ **Desenvolvimento de Software Sob Medida**
- ✅ **Automações de Processos e Marketing**
- ✅ **Agentes de IA e Chatbots**
- ✅ **Gestão de Tráfego Pago**
- ✅ **Business Intelligence (Análise de Dados)**

**IA, automações e BI para transformar seu negócio.**

### 📞 Contato

- **Website:** [https://www.topstack.com.br/](https://www.topstack.com.br/)
- **Telefone:** (51) 99305-3612
- **Facebook:** [@topstack.br](https://www.facebook.com/profile.php?id=61582479626027)
- **Instagram:** [@topstack.br](https://www.instagram.com/topstack.br/)

**Horário de funcionamento:**
- Segunda a Sábado: 08:00–18:00
- Domingo: Fechado

---

## 📖 Sobre o Projeto

ADS Analytics é uma aplicação web desenvolvida para análise e comparação de dados de campanhas publicitárias. O sistema permite:

- 📊 **Importar planilhas** do Meta Ads e Google Ads (CSV e XLSX)
- 🔄 **Comparar datasets** lado a lado ou mesclar dados
- 📈 **Visualizar métricas** em tabelas e gráficos interativos
- 🎯 **Filtrar dados** por conta, campanha, conjunto de anúncios ou anúncio
- 📅 **Agrupar por** diferentes níveis hierárquicos
- 📉 **Analisar performance** com métricas como ROAS, CPA, CTR, CPM, CPC

---

## 🛠️ Tecnologias

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **Recharts** - Biblioteca de gráficos para React
- **PapaParse** - Parser de CSV
- **XLSX** - Leitura de arquivos Excel

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Passos

1. **Clone o repositório:**
   ```bash
   git clone <repository-url>
   cd ADS-ANALYTICS
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   ```
   http://localhost:7474
   ```

---

## 📁 Estrutura do Projeto

```
ADS-ANALYTICS/
├── assets/
│   └── visual-identity/     # Logos, favicons e imagens da TOPSTACK
├── components/              # Componentes React
│   ├── ColumnSelector.tsx
│   ├── DataChart.tsx
│   ├── DataTable.tsx
│   ├── Sidebar.tsx
│   └── StatsCards.tsx
├── planilhas/               # Planilhas de exemplo
│   ├── meta/
│   └── google/
├── types/                   # Definições TypeScript
├── utils/                   # Utilitários e parsers
│   ├── aggregation.ts
│   └── parsers/
│       ├── common.ts
│       ├── excel.ts
│       ├── google.ts
│       └── meta.ts
├── App.tsx                  # Componente principal
├── index.html               # HTML principal
├── index.tsx                # Entry point
└── vite.config.ts           # Configuração do Vite
```

---

## 🎯 Funcionalidades

### Importação de Dados

- Suporte para arquivos **CSV** e **XLSX**
- Carregamento automático de planilhas na pasta `planilhas/`
- Upload manual de arquivos
- Detecção automática de novos arquivos

### Análise e Comparação

- **Modo Comparação:** Compare dois datasets lado a lado com indicadores de variação
- **Modo Mesclagem:** Some dados de múltiplos datasets
- Filtros hierárquicos em cascata (Conta → Campanha → Conjunto → Anúncio)
- Agrupamento por diferentes níveis

### Visualização

- **Tabelas interativas** com ordenação e visualização semanal
- **Gráficos diversos:** Área, Barras, Pizza, Linhas, Radar
- **KPIs em tempo real:** Investimento, Conversões, CPA, Cliques
- **Modo escuro/claro**

---

## 📊 Métricas Disponíveis

- **Investimento (Spend)** - Valor gasto em anúncios
- **Receita (Revenue)** - Receita gerada
- **ROAS** - Return on Ad Spend
- **CPA** - Custo por Aquisição
- **Cliques** - Número de cliques
- **Impressões** - Número de impressões
- **Conversões** - Número de conversões
- **CTR** - Click-Through Rate
- **CPM** - Custo por Mil Impressões
- **CPC** - Custo por Clique

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 📝 Formato das Planilhas

### 📋 Nomenclatura de Arquivos

**IMPORTANTE**: Para que o sistema organize automaticamente as planilhas por mês e selecione a mais recente, siga o padrão de nomenclatura:

```
[prefixo]-[plataforma]-[mes].csv
ou
[prefixo]-[plataforma]-[mes].xlsx
```

**Exemplos válidos**:
- `relatorio-meta-nov.csv` ✅
- `relatorio-meta-dez.xlsx` ✅
- `meta-ago.csv` ✅

**Siglas de meses válidas**: `jan`, `fev`, `mar`, `abr`, `mai`, `jun`, `jul`, `ago`, `set`, `out`, `nov`, `dez`

O sistema ordena automaticamente as planilhas por mês em ordem decrescente (mais recente primeiro) e seleciona automaticamente a do mês vigente ou anterior.

📖 **Documentação completa**: Consulte [`docs/NOMENCLATURA_PLANILHAS.md`](docs/NOMENCLATURA_PLANILHAS.md) para detalhes sobre o formato de nomenclatura.

### Meta Ads

O sistema espera planilhas CSV ou XLSX exportadas do Meta Ads com as seguintes colunas (em português):
- Nome da conta
- Nome da campanha
- Nome do conjunto de anúncios
- Nome do anúncio
- Dia
- Valor usado (BRL)
- Impressões
- Cliques no link
- Leads
- Alcance

### Google Ads

O sistema espera planilhas CSV ou XLSX exportadas do Google Ads com as seguintes colunas (em português):
- Campanha
- Custo
- Conversões
- Impressões
- Cliques

---

## 🤝 Contribuindo

Este é um projeto desenvolvido pela TOPSTACK. Para sugestões ou melhorias, entre em contato através dos canais oficiais.

---

## 📄 Licença

Este projeto é propriedade da TOPSTACK. Todos os direitos reservados.

---

## 🙏 Agradecimentos

Desenvolvido com ❤️ pela equipe TOPSTACK.

**Transformando tecnologia em vantagem competitiva.**

---

<div align="center">
  <p>
    <a href="https://www.topstack.com.br/">Website</a> •
    <a href="https://www.facebook.com/profile.php?id=61582479626027">Facebook</a> •
    <a href="https://www.instagram.com/topstack.br/">Instagram</a>
  </p>
  <p>© 2025 TOPSTACK. Todos os direitos reservados.</p>
</div>
