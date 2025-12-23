# 📋 Nomenclatura de Planilhas - ADS Analytics

## 📌 Formato de Nomenclatura

Para que o sistema organize automaticamente as planilhas por mês e selecione a mais recente, é necessário seguir o padrão de nomenclatura abaixo:

### Padrão Esperado

```
[prefixo]-[plataforma]-[mes].csv
ou
[prefixo]-[plataforma]-[mes].xlsx
```

### Exemplos Válidos

- `relatorio-meta-nov.csv` ✅
- `relatorio-meta-dez.xlsx` ✅
- `meta-ago.csv` ✅
- `relatorio-google-out.csv` ✅
- `planilha-meta-jul.xlsx` ✅

### Regras Importantes

1. **Sigla do Mês**: O último segmento antes da extensão deve ser uma sigla de mês em português (3 letras)
2. **Separador**: Use hífen (`-`) para separar os segmentos
3. **Extensão**: Suporta `.csv`, `.xlsx` ou `.xls`

## 📅 Siglas de Meses Válidas

| Sigla | Mês Completo | Valor |
|-------|--------------|-------|
| `jan` | Janeiro | 1 |
| `fev` | Fevereiro | 2 |
| `mar` | Março | 3 |
| `abr` | Abril | 4 |
| `mai` | Maio | 5 |
| `jun` | Junho | 6 |
| `jul` | Julho | 7 |
| `ago` | Agosto | 8 |
| `set` | Setembro | 9 |
| `out` | Outubro | 10 |
| `nov` | Novembro | 11 |
| `dez` | Dezembro | 12 |

## 🔄 Comportamento do Sistema

### Ordenação Automática

O sistema ordena automaticamente as planilhas por mês em **ordem decrescente** (mais recente primeiro):

1. **Detecção**: Extrai a sigla do mês do nome do arquivo
2. **Ordenação**: Organiza por ano e mês (mais recente primeiro)
3. **Exibição**: Lista as planilhas ordenadas no seletor de datasets

### Seleção Automática

- **Mês Vigente**: Se existir uma planilha do mês atual, ela será selecionada automaticamente
- **Mês Anterior**: Se não houver planilha do mês vigente, seleciona automaticamente a do mês anterior
- **Mais Recente**: Em caso de múltiplas planilhas do mesmo mês, seleciona a primeira encontrada

### Exemplo de Ordenação

Dadas as seguintes planilhas:
- `relatorio-meta-nov.csv` (Novembro)
- `relatorio-meta-dez.csv` (Dezembro)
- `relatorio-meta-out.csv` (Outubro)
- `relatorio-meta-set.csv` (Setembro)

**Ordem de exibição** (mais recente primeiro):
1. `relatorio-meta-dez.csv` ⭐ (selecionada automaticamente se for dezembro)
2. `relatorio-meta-nov.csv`
3. `relatorio-meta-out.csv`
4. `relatorio-meta-set.csv`

## ⚠️ Casos Especiais

### Arquivos sem Sigla de Mês

Arquivos que não seguem o padrão serão ordenados no final da lista (valor 0).

**Exemplos**:
- `relatorio-meta.csv` ❌ (sem sigla de mês)
- `meta-dados.xlsx` ❌ (sem sigla de mês)

### Arquivos com Sigla Inválida

Se a sigla não corresponder a um mês válido, o arquivo será ordenado no final.

**Exemplos**:
- `relatorio-meta-xyz.csv` ❌ (sigla inválida)
- `meta-abc.xlsx` ❌ (sigla inválida)

### Múltiplas Planilhas do Mesmo Mês

Se houver múltiplas planilhas do mesmo mês, todas serão agrupadas e ordenadas alfabeticamente dentro do mesmo mês.

**Exemplo**:
- `relatorio-meta-nov-v1.csv`
- `relatorio-meta-nov-v2.csv`
- `relatorio-meta-nov.csv`

Todas aparecerão juntas na seção de novembro, ordenadas alfabeticamente.

## 📁 Estrutura de Pastas Recomendada

```
planilhas/
├── meta/
│   ├── relatorio-meta-jan.csv
│   ├── relatorio-meta-fev.csv
│   ├── relatorio-meta-mar.csv
│   └── ...
└── google/
    ├── relatorio-google-jan.csv
    ├── relatorio-google-fev.csv
    └── ...
```

## 🔧 Implementação Técnica

O sistema utiliza a função `extractMonthFromFilename()` que:

1. Remove a extensão do arquivo (`.csv`, `.xlsx`, etc.)
2. Procura por um padrão `-[sigla]` no final do nome
3. Valida se a sigla corresponde a um mês válido
4. Retorna a sigla em minúsculas ou `null` se não encontrada

### Código de Referência

```typescript
// Extrai sigla do mês do nome do arquivo
const month = extractMonthFromFilename('relatorio-meta-nov.csv');
// Retorna: 'nov'

// Ordena datasets por mês
const sorted = sortDatasetsByMonth(datasets);
// Retorna: datasets ordenados (mais recente primeiro)

// Obtém o dataset mais recente
const mostRecent = getMostRecentDataset(datasets);
// Retorna: dataset do mês mais recente
```

## ✅ Checklist de Validação

Antes de adicionar uma planilha, verifique:

- [ ] O nome do arquivo termina com `-[sigla].csv` ou `-[sigla].xlsx`
- [ ] A sigla corresponde a um mês válido (jan, fev, mar, etc.)
- [ ] O arquivo está na pasta correta (`planilhas/meta/` ou `planilhas/google/`)
- [ ] O formato do arquivo está correto (CSV ou XLSX)

## 📞 Suporte

Em caso de dúvidas sobre a nomenclatura ou problemas com a ordenação automática, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: Dezembro 2025  
**Versão**: 1.0

