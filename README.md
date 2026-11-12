# ND7 Garage — Site Oficial & Catálogo de Veículos

Website moderno, responsivo e de alta performance desenvolvido sob medida para a **ND7 Garage** (Venda e Consultoria Automotiva), localizada em Santa Bárbara d'Oeste - SP.

O projeto foi construído respeitando integralmente a identidade visual da revenda, presente no seu Instagram oficial ([@nd7garage](https://www.instagram.com/nd7garage/)) e na fachada física da loja (em frente ao Tivoli Shopping), integrando o catálogo completo de veículos anunciado no portal [CarroSP](https://carrosp.com.br/santa-barbara-doeste-sp/nd7-garage/).

---

## 🏎️ Principais Funcionalidades

1. **Identidade Visual Fiel & Exclusiva:**
   - Paleta de cores oficial: **Preto Profundo** (`#0a0a0d`), **Vermelho Corrida** (`#e51926`) e **Dourado Troféu** (`#f5b800`).
   - Logotipo oficial vetorizado em formato SVG (escudo dourado com corte esportivo, letras "ND" em branco, numeral "7" em vermelho e tipografia cursiva "garage").
   - Faixa decorativa "racing stripes" inspirada diretamente na marquise da loja física.
   - Tipografia moderna (*Outfit* e *Plus Jakarta Sans*).

2. **Catálogo Completo Sincronizado (16 Veículos do CarroSP):**
   - Imagens em alta definição direto da CDN.
   - Todos os modelos catalogados:
     - **Chevrolet 3100 3.9 I6 Deluxe (1954)** — Clássico Colecionador
     - **Jeep Wrangler 3.6 V6 Unlimited Sahara 4x4 (2018)**
     - **Jeep Commander 2.0 TD380 Overland 4x4 Diesel (2022)** — 7 Lugares
     - **Toyota Hilux SW4 3.0 SRV 4x4 Diesel (2014)** — 7 Lugares
     - **Honda Civic 2.0 16V Sport Flex Manual (2017)** — G10
     - **Honda HR-V 1.8 16V EXL Flex CVT (2018)**
     - **Hyundai IX35 2.0 16V GLS Flex AT (2017)**
     - **Toyota Corolla 2.0 16V XEI Flex AT (2014)**
     - **Honda Fit 1.5 16V EX Flex CVT (2015)**
     - **Volkswagen Gol 1.0 12V MPI G7 Flex (2023)**
     - **Hyundai HB20 Hatch 1.6 16V Comfort Flex (2014)**
     - **Ford Ka Hatch 1.0 12V Ti-VCT SE Flex (2020)**
     - **Honda Fit 1.4 4P LX Manual (2007)**
     - **Chevrolet Astra Sedan 2.0 4P Advantage Flex (2007)**
     - **Honda CB 300 F Twister Flex CBS (2025)** — 7.000 km
     - **Honda CG 125 Titan ES (1999)** — Partida Elétrica

3. **Filtros e Busca Instantânea:**
   - Campo de busca em tempo real por nome, marca ou modelo.
   - Filtro por categorias com badges de contagem (SUVs, Sedans, Hatches, Picapes, Motos).
   - Filtro por marca e tipo de câmbio (Automático/Manual).
   - Ordenação inteligente (menor preço, maior preço, mais novo, menor km).

4. **Modal de Detalhes com Simulador de Financiamento:**
   - Ficha técnica completa de cada veículo.
   - Lista de opcionais e histórico.
   - **Simulador Interativo**: ajuste a entrada pelo slider e selecione o prazo (24x, 36x, 48x, 60x) para ver a parcela estimada na hora.
   - Botão para **enviar a simulação pré-formatada direto para o WhatsApp da ND7 Garage**.

5. **Avaliação de Veículo Usado (Trade-in):**
   - Formulário para o cliente preencher dados do carro dele (Marca, Modelo, Ano, KM) e enviar no WhatsApp da equipe da loja para avaliação imediata.

6. **Área do Instagram (@nd7garage):**
   - Reprodução do cabeçalho do perfil oficial com botão "Seguir no Instagram".
   - Cards estilo posts com engajamento, hashtags e fotos em destaque.

7. **Localização e Contato:**
   - Mapa interativo do Google Maps com a localização exata da loja: **Rua do Ósmio, 193 - Jardim Mollon, Santa Bárbara d'Oeste - SP** (em frente ao Tivoli Shopping).
   - Tabela de horários de funcionamento.
   - Telefones clicáveis: (19) 3629-3909 e (19) 99560-3366.
   - Botão flutuante fixo do WhatsApp com animação de pulso.

---

## 📂 Estrutura de Arquivos

```
nd7-garage/
├── index.html          # Estrutura completa da landing page
├── styles.css          # Estilização CSS responsiva e temas
├── app.js              # Interações, busca, filtros e simulador
├── vehicles.js         # Base de dados dos 16 veículos e dados da loja
├── abrir-site.bat      # Atalho para abrir no navegador padrão com 2 cliques
├── assets/
│   ├── logo.svg        # Logotipo oficial vetorizado ND7 Garage
│   └── fachada.webp    # Foto oficial da loja física em Santa Bárbara
└── README.md           # Documentação do projeto
```

---

## 🚀 Como Executar

### Opção 1 (Mais fácil no Windows):
Dê um duplo clique no arquivo `abrir-site.bat` localizado nesta pasta. Ele abrirá o site automaticamente no seu navegador padrão!

### Opção 2:
Abra o arquivo `index.html` com qualquer navegador (Google Chrome, Microsoft Edge, Firefox, etc.).

### Opção 3 (Servidor local):
Se desejar rodar via terminal, você pode usar qualquer servidor estático:
```powershell
# Exemplo com npx
npx serve .
```

---

## 📲 Contatos Oficiais ND7 Garage
- **WhatsApp:** (19) 99560-3366
- **Telefone:** (19) 3629-3909
- **Instagram:** [@nd7garage](https://www.instagram.com/nd7garage/)
- **Endereço:** Rua do Ósmio, 193 - Jardim Mollon, Santa Bárbara d'Oeste - SP (ao lado do Tivoli Shopping)
