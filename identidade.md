# IDENTIDADE VISUAL — Tucano Finanças

## Stack Técnica
- Tailwind CSS para toda estilização (NUNCA criar arquivos .css separados)
- shadcn/ui como base de componentes, customizados via className
- Todos os valores visuais definidos como TOKENS SEMÂNTICOS no tailwind.config
- NUNCA usar valores hardcoded no código — sempre tokens semânticos
- NUNCA usar cores/radius/sombras padrão do Tailwind — apenas tokens deste documento
- A IA que implementa é RESPONSÁVEL por criar SVGs originais e composições visuais únicas baseadas nas descrições abaixo — NÃO use decoração genérica (blobs, dot grids, partículas) como substituto
- A paleta usa UMA cor accent forte + neutros. NÃO crie arco-íris de categorias. A identidade é uma cor só.

---

## A Alma do App

Tucano Finanças não é um dashboard.  
É uma ferramenta de consciência financeira silenciosa.  
Cada elemento existe para mostrar fluxo, decisão e consequência — sem distração, sem entretenimento.

---

## Referências e Princípios

- **Supabase:** Estrutura com elemento central + representação espacial → Princípio: dados viram entidades no espaço → Aplicação: saldo e fluxo financeiro como sistema visual, não lista
- **Linear:** Minimalismo com tensão visual → Princípio: contraste e ritmo criam identidade → Aplicação: layout com respiro e pontos de foco agressivos
- **Vercel:** Ausência de cor como identidade → Princípio: forma e tipografia sustentam o produto → Aplicação: UI funcional com presença, não decoração

---

## Decisões de Identidade

# MOBILE FIRST (REGRA PRINCIPAL)

O app é concebido para uso diário, rápido, quase instintivo.

## ESTRUTURA

### Navegação (Mobile)
**O que:** Bottom navigation fixa com 3 áreas principais
- Visão (home)
- Movimentação
- Planejamento

**Por que:**
Mobile exige acesso imediato. Sidebar é desperdício de dedo.

**Como:**
Barra fixa inferior com:
- ícones monocromáticos
- estado ativo com accent
- labels curtos

**Nunca:**
- Nunca usar sidebar em mobile
- Nunca esconder navegação essencial em menus

---

### Layout (Mobile)
**O que:** Estrutura vertical com um elemento dominante por tela

**Por que:**
Foco. Uma decisão por vez.

**Como:**
- topo: contexto (mês / visão atual)
- centro: elemento principal
- base: ações

**Nunca:**
- grids com múltiplos cards competindo

---

### Desktop (Secundário)
**O que:** Expansão do mobile, não redesign

**Por que:**
Desktop não é prioridade — é extensão

**Como:**
- mantém estrutura
- adiciona área lateral apenas para contexto extra
- nunca transforma em dashboard corporativo

---

## LINGUAGEM

### Tipografia
**O que:** Sans moderna + números com presença

**Por que:**
Finanças = números são protagonistas

**Como:**
- valores com peso alto
- texto secundário discreto
- alinhamento rigoroso

**Nunca:**
- tipografia decorativa
- múltiplas fontes

---

### Cor (REGRA CRÍTICA)

UMA única cor accent: **Verde profundo tecnológico**

**Por que:**
- associa com dinheiro sem ser clichê
- transmite controle

**Uso:**
- ações
- elementos ativos
- indicadores de movimento

**Nunca:**
- cores por categoria
- gradientes chamativos

---

### Geometria
**O que:** cantos médios, não extremos

**Por que:**
equilíbrio entre humano e técnico

**Nunca:**
- UI totalmente arredondada (infantil)
- UI totalmente reta (fria demais)

---

### Profundidade
**O que:** quase flat

**Por que:**
clareza > efeito

---

## RIQUEZA VISUAL

### Textura Ambiente

**O que:** grid técnico extremamente sutil

**Temática:** estrutura / organização / controle

**Tratamento:**
- linhas finas
- opacidade 3-4%
- fixa no fundo
- monocromática

---

## CONCEITOS VISUAIS (CORE DO APP)

---

### 1. Card de Saldo (Elemento Central)

**Representa:**  
Estado financeiro atual — equilíbrio ou tensão

**Metáfora visual:**  
Reservatório de energia / nível dinâmico

**Cena detalhada:**
- Uma linha horizontal atravessa o card (nível base)
- Abaixo da linha: área preenchida sutilmente (representa saldo acumulado)
- A superfície dessa área é levemente ondulada (micro variação)
- Pequenos pontos surgem e descem (entradas)
- Pequenos pontos sobem e desaparecem (saídas)
- A linha principal é neutra
- movimentos (entradas/saídas) usam accent

**Viabilidade:** Código puro (SVG + animação simples)

---

### 2. Fluxo de Transações

**Representa:**  
Movimento do dinheiro ao longo do tempo

**Metáfora visual:**  
Corrente / fluxo contínuo

**Cena detalhada:**
- Linha vertical fina (timeline)
- Cada transação é um nó
- Entradas aparecem à direita, saídas à esquerda
- Cada nó conecta com pequenas linhas inclinadas
- Espaçamento irregular (simula vida real, não grid perfeito)
- Elementos surgem com leve movimento vertical

**Viabilidade:** Código puro

---

### 3. Planejamento (Metas)

**Representa:**  
Objetivo financeiro como jornada

**Metáfora visual:**  
Caminho progressivo com checkpoints

**Cena detalhada:**
- Linha curva suave
- Pontos ao longo do caminho (milestones)
- Um marcador atual destacado
- O trecho já percorrido mais forte
- o restante mais sutil
- marcador atual usa accent

**Viabilidade:** Código puro

---

### 4. Lista de Compras

**Representa:**  
Decisão consciente antes do gasto

**Metáfora visual:**  
Fila de execução / pipeline

**Cena detalhada:**
- Itens empilhados verticalmente
- Cada item conectado por linha lateral
- Estado:
  - pendente: neutro
  - aprovado: ganha marcação lateral accent
- item ativo levemente deslocado (como sendo puxado)

**Viabilidade:** Código puro

---

### 5. Visão Mensal

**Representa:**  
Ciclo financeiro

**Metáfora visual:**  
Anel incompleto (ciclo aberto)

**Cena detalhada:**
- círculo incompleto (80-90%)
- início e fim visíveis
- segmentos discretos indicando períodos
- ponto móvel indica "agora"
- progresso usa accent

**Viabilidade:** Código puro

---

### 6. Empty State

**Representa:**  
Ausência de movimento

**Metáfora visual:**  
Sistema em repouso

**Cena detalhada:**
- linha horizontal única
- poucos pontos estáticos
- espaço vazio dominante
- nenhuma animação

**Viabilidade:** Código puro

---

## Tokens de Design

### Cores — Fundos
| Token | Valor | Uso |
|---|---|---|
| surface-page | #0B0C0E | Fundo principal |
| surface-card | #121417 | Cards |
| surface-elevated | #171A1F | Elementos elevados |

### Cores — Texto
| Token | Valor | Uso |
|---|---|---|
| text-primary | #E6E8EB | Títulos |
| text-secondary | #A1A6AD | Apoio |
| text-muted | #6B7078 | Hints |

### Cores — Accent
| Token | Valor | Uso |
|---|---|---|
| accent-primary | #2BD97F | A cor da marca |
| accent-hover | #25C46F | Hover |
| accent-subtle | rgba(43,217,127,0.12) | Fundos leves |

---

### Status
| Token | Valor |
|---|---|
| status-success | #2BD97F |
| status-error | #FF5C5C |
| status-warning | #FFB020 |

---

### Bordas
| Token | Valor |
|---|---|
| border-default | rgba(255,255,255,0.08) |
| border-subtle | rgba(255,255,255,0.04) |

---

### Geometria
| Token | Valor |
|---|---|
| radius-card | 16px |
| radius-button | 12px |
| radius-input | 10px |

---

### Sombras
| Token | Valor |
|---|---|
| shadow-card | 0 4px 20px rgba(0,0,0,0.25) |
| shadow-hover | 0 6px 30px rgba(0,0,0,0.35) |
| shadow-float | 0 10px 40px rgba(0,0,0,0.45) |

---

## Componentes Shadcn — Overrides

| Componente | Override |
|---|---|
| Card | fundo surface-card + border-subtle + radius-card |
| Button | accent-primary + radius-button |
| Badge | accent-subtle + accent-primary |
| Input | surface-elevated + border-default |
| Avatar | minimal, sem destaque |

---

## Regra de Ouro

O app não mostra dados.  
Ele mostra **fluxo, estado e decisão**.

Cada componente importante deve:
- ter um conceito visual claro
- ser legível em 2 segundos
- não depender de cor para significado

---

## Teste Final

Se parecer:
- dashboard SaaS → falhou  
- app de banco divertido → falhou  
- template shadcn com cor verde → falhou  

Se parecer:
> uma ferramenta silenciosa que mostra o comportamento do dinheiro como sistema vivo

Aí sim você acertou.