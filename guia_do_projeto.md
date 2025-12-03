# Guia de Construção do Projeto: Compartilha AI

## Para Quem é Este Guia?

Este documento é para você, futuro desenvolvedor. Ele foi reescrito para contar a história da construção do **Compartilha AI**, não apenas como um manual, mas como um mapa detalhado da nossa arquitetura. O objetivo é que, ao final da leitura, você entenda não só **o que** foi feito, mas **como** e **por que** cada peça se encaixa. Se algo quebrar, este guia será seu primeiro recurso para encontrar a origem do problema.

---

## Parte 1: A Cozinha (O Backend com FastAPI)

Nossa "cozinha" é o cérebro da operação. É um serviço **FastAPI** que roda em um servidor, completamente invisível ao usuário final. Sua missão é clara e dividida em três grandes responsabilidades:

1.  **Orquestrar a Inteligência Artificial**: É o backend que conversa com o modelo Gemini do Google para ler e interpretar as imagens das comandas.
2.  **Executar a Lógica de Negócio**: Toda a matemática da divisão de contas, a distribuição de itens e o cálculo de totais acontece aqui.
3.  **Gerenciar o Estado da Sessão**: Ele mantém o controle dos dados de uma única sessão de divisão de conta (itens, pessoas, etc.).

### 1.1. As Ferramentas da Cozinha (Tecnologias)

*   **Linguagem: Python**: A escolha natural. É a linguagem franca do mundo da IA, com uma sintaxe limpa e um ecossistema robusto, tornando a integração com o Gemini muito mais simples.
*   **Framework: FastAPI**: Para a API, queríamos velocidade e simplicidade. FastAPI é incrivelmente performático e, mais importante, gera automaticamente uma documentação interativa (via Swagger UI). Isso é inestimável para desenvolvimento e debugging. Ao rodar o backend localmente, basta ir para `http://127.0.0.1:8000/docs` para ver e testar todos os endpoints.
*   **IA Generativa: Google Gemini**: O coração da funcionalidade de scanner. Usamos o `google-generativeai` SDK para enviar a imagem da comanda para a API do Gemini, que a processa e retorna uma estrutura de dados (JSON) com os itens, quantidades e preços.
*   **Validação de Dados: Pydantic**: Integrado ao FastAPI, o Pydantic nos permite definir "schemas" (modelos de dados). Isso significa que podemos declarar como os dados que chegam e saem da nossa API devem se parecer. Se o frontend enviar um dado no formato errado, o FastAPI/Pydantic o rejeita automaticamente, prevenindo uma classe inteira de bugs.

### 1.2. A Estrutura da Cozinha

A pasta `backend/` é organizada de forma simples e eficaz:

*   `main.py`: O coração da nossa API. É aqui que todos os endpoints são definidos e a lógica principal é orquestrada.
*   `schemas.py`: Define os "contratos" de dados da nossa aplicação usando Pydantic. É o nosso "manual de instruções" para os dados.
*   `services/ia_scanner.py`: Um módulo isolado que contém toda a lógica para interagir com a API do Gemini. Isso mantém o código de IA separado do código da API, facilitando a manutenção.

### 1.3. O Cardápio da Cozinha (Análise dos Endpoints)

Vamos analisar cada endpoint definido em `main.py`, que é o "cardápio" de funcionalidades que nosso backend oferece ao frontend.

#### **`POST /api/scan`**

*   **O que faz?** Este é o ponto de partida. O frontend envia a imagem da comanda para este endpoint.
*   **Como funciona?**
    1.  Recebe um arquivo de imagem (`UploadFile`).
    2.  Salva a imagem temporariamente no servidor.
    3.  Chama a função `scan_receipt_to_json` do nosso `ia_scanner.py`, passando o caminho do arquivo.
    4.  A função `scan_receipt_to_json` envia a imagem para a IA do Gemini e espera pela resposta em formato JSON.
    5.  Cria uma nova "divisão" (uma sessão de divisão de conta) em nossa memória interna (`sessoes_divisao`), usando um UUID único como identificador.
    6.  Armazena os itens extraídos pela IA nesta nova divisão.
    7.  Retorna o ID da divisão e os itens para o frontend.
*   **Onde procurar por bugs?**
    *   **Erro na IA**: Se a IA não conseguir ler a imagem ou retornar um JSON malformado, este endpoint falhará. Verifique o `ia_scanner.py` e os logs do servidor para ver a resposta exata da API do Gemini.
    *   **Problemas de Arquivo**: Se houver um problema ao salvar ou ler o arquivo de imagem, a falha estará aqui. Verifique as permissões de pasta no servidor.

#### **`POST /api/divisao`**

*   **O que faz?** Depois que o usuário confirma os itens escaneados, o frontend chama este endpoint para adicionar as pessoas que participarão da divisão.
*   **Como funciona?**
    1.  Recebe um payload JSON com o ID da divisão e uma lista de nomes de pessoas (`CriarDivisaoPayload`).
    2.  Encontra a sessão de divisão correspondente na memória.
    3.  Cria objetos `Pessoa` para cada nome e os adiciona à divisão.
    4.  Retorna a estrutura completa da divisão, agora com as pessoas incluídas.
*   **Onde procurar por bugs?**
    *   **ID da Divisão Inválido**: Se o `divisao_id` enviado pelo frontend não existir na memória do backend, ele retornará um erro 404. Isso pode acontecer se o estado do frontend e do backend ficarem dessincronizados.

#### **`POST /api/distribuir`**

*   **O que faz?** Este é o endpoint central da lógica de divisão. Ele atribui um item (ou parte dele) a uma ou mais pessoas.
*   **Como funciona?**
    1.  Recebe um payload com o ID da divisão, o nome do item e uma lista de nomes de pessoas que o consumiram (`DistribuirItemPayload`).
    2.  Localiza a divisão e o item específico dentro dela.
    3.  Atualiza o campo `consumido_por` do item com a lista de pessoas fornecida.
    4.  Retorna a estrutura atualizada da divisão.
*   **Onde procurar por bugs?**
    *   **Nome do Item/Pessoa Incorreto**: Se os nomes no payload não corresponderem exatamente aos nomes armazenados na divisão, a lógica pode falhar.
    *   **Lógica de Distribuição**: Se a divisão não estiver sendo calculada corretamente, a falha provavelmente está na forma como o campo `consumido_por` é preenchido aqui.

#### **`GET /api/calcular-totais/{divisao_id}`**

*   **O que faz?** Calcula e retorna o valor final que cada pessoa deve pagar.
*   **Como funciona?**
    1.  Recebe o ID da divisão na própria URL.
    2.  Inicializa um dicionário para rastrear o total de cada pessoa.
    3.  Itera sobre cada `item` na divisão:
        *   Verifica quantas pessoas consumiram aquele item (`len(item.consumido_por)`).
        *   Calcula o `valor_por_pessoa` para aquele item (`item.valor_total / numero_de_pessoas`).
        *   Adiciona esse valor ao total de cada pessoa que consumiu o item.
    4.  Calcula o `valor_total_conta`.
    5.  Retorna um objeto `TotaisResponse` com o total de cada pessoa e o total geral.
*   **Onde procurar por bugs?**
    *   **Matemática da Divisão**: Se os totais estiverem incorretos, a lógica de cálculo dentro deste endpoint é o lugar para investigar. Depure os valores de `valor_por_pessoa` e a forma como são somados.
    *   **Itens não distribuídos**: Itens que não foram atribuídos a ninguém (`consumido_por` está vazio) são ignorados. Se um item parece estar faltando no cálculo, verifique se ele foi distribuído corretamente.

---

## Parte 2: O Salão do Restaurante (O Frontend com React)

O "salão" é a interface com a qual o usuário interage. Construído com **React**, é uma Single-Page Application (SPA) que guia o usuário através de um fluxo passo a passo, desde o upload da imagem até a visualização do resumo da conta.

### 2.1. As Ferramentas do Salão (Tecnologias)

*   **Biblioteca de UI: React**: Usamos React para construir nossa interface em componentes reutilizáveis. A aplicação é essencialmente uma "máquina de estados" onde cada estado corresponde a uma tela principal.
*   **Gerenciamento de Estado: `useState`**: Para a simplicidade deste projeto, usamos o hook `useState` do próprio React. O estado principal (dados da divisão, tela atual) é gerenciado no componente `App.jsx` e passado para os componentes filhos como "props".
*   **Ferramenta de Build: Vite**: Nos dá um ambiente de desenvolvimento extremamente rápido com Hot Module Replacement (HMR), o que significa que as alterações no código são refletidas no navegador quase instantaneamente.
*   **Estilização: TailwindCSS**: Permite-nos estilizar a aplicação diretamente no JSX usando classes utilitárias. Isso acelera o desenvolvimento e mantém o estilo e a lógica no mesmo lugar (dentro do componente).
*   **Comunicação com API: Axios**: Embora `fetch` seja nativo, usamos Axios por sua simplicidade, tratamento de erros e capacidade de configurar uma instância base (veja `services/api.js`).

### 2.2. A Estrutura do Salão (`frontend/src/`)

*   `main.jsx`: O ponto de entrada da aplicação. Ele simplesmente renderiza nosso componente principal, `App`.
*   `App.jsx`: O **componente orquestrador**. Ele controla tudo. É aqui que o estado principal da aplicação reside e é ele quem decide qual tela (`UploadScreen`, `PeopleScreen`, etc.) deve ser mostrada ao usuário.
*   `components/`: Esta pasta contém todos os nossos "blocos de Lego". Cada arquivo `.jsx` aqui é um pedaço da nossa interface.
*   `services/api.js`: Centraliza a configuração do Axios. Se precisarmos mudar a URL base da nossa API, mudamos em um só lugar.

### 2.3. O Fluxo do Salão (Análise das Telas/Componentes)

O fluxo do usuário é controlado pelo estado `screen` em `App.jsx`. Vamos seguir a jornada do usuário:

#### **1. `UploadScreen.jsx` (Tela Inicial)**

*   **Responsabilidade**: Permitir que o usuário selecione e envie uma imagem da comanda.
*   **Lógica Principal**:
    1.  Usa `useState` para manter o arquivo selecionado (`selectedFile`) e o estado de carregamento (`isLoading`).
    2.  Quando o usuário clica em "Escanear Comanda", ele chama a função `handleScan`, que:
        *   Cria um `FormData` para enviar o arquivo.
        *   Faz uma requisição `POST` para o endpoint `/api/scan` do backend.
        *   Ao receber a resposta, chama a função `onScanComplete` (que foi passada como prop por `App.jsx`).
*   **Comportamento Estranho?**
    *   **Upload não funciona**: Verifique o console do navegador para erros de rede. Pode ser um problema de CORS (verifique a configuração no `main.py` do backend) ou a URL da API pode estar incorreta.
    *   **Spinner de carregamento infinito**: O backend pode ter travado ou retornado um erro. Verifique os logs do backend.

#### **2. `PeopleScreen.jsx`**

*   **Responsabilidade**: Permitir que o usuário adicione os nomes das pessoas que vão dividir a conta.
*   **Lógica Principal**:
    1.  Recebe os itens escaneados como prop (`initialItems`).
    2.  Gerencia uma lista de pessoas (`people`) e o nome da pessoa atual no input (`personName`) usando `useState`.
    3.  O botão "Finalizar" chama a função `handleFinalize`, que faz um `POST` para `/api/divisao` com os itens e as pessoas.
    4.  Ao receber a resposta, chama `onPeopleDefined` (prop de `App.jsx`) com os dados completos da divisão.
*   **Comportamento Estranho?**
    *   **Não consegue adicionar pessoas**: Verifique a lógica das funções `handleAddPerson` e `handleRemovePerson`.
    *   **Erro ao finalizar**: O payload enviado para `/api/divisao` pode estar malformado. Use as ferramentas de desenvolvedor do navegador para inspecionar a requisição.

#### **3. `DistributionScreen.jsx`**

*   **Responsabilidade**: A tela mais complexa. É aqui que o usuário atribui cada item a uma ou mais pessoas.
*   **Lógica Principal**:
    1.  Recebe todos os dados da divisão (`initialDivisionData`).
    2.  Abre um modal (`ModalDistribuir.jsx`) quando o usuário clica em "Distribuir" em um `ItemCard.jsx`.
    3.  O modal permite selecionar as pessoas e, ao salvar, faz um `POST` para `/api/distribuir`.
    4.  Após cada distribuição bem-sucedida, a tela atualiza seu estado para refletir a mudança.
    5.  Usa `useEffect` para chamar o endpoint `/api/calcular-totais/{divisao_id}` sempre que os dados da divisão são atualizados, mantendo os totais sempre sincronizados.
*   **Comportamento Estranho?**
    *   **Item não é atribuído corretamente**: Verifique o payload enviado para `/api/distribuir` a partir do `ModalDistribuir`.
    *   **Totais não atualizam**: O `useEffect` pode não estar sendo acionado. Verifique sua lista de dependências. Ou, o endpoint de totais no backend pode estar com problemas. Verifique a aba "Network" no navegador.

#### **4. `SummaryScreen.jsx`**

*   **Responsabilidade**: Mostrar o resumo final da conta.
*   **Lógica Principal**:
    1.  Recebe os totais calculados (`totals`) e os dados da divisão (`divisionData`) como props.
    2.  Simplesmente renderiza os dados: o valor que cada pessoa deve pagar e os itens que cada uma consumiu.
*   **Comportamento Estranho?**
    *   **Dados incorretos**: Se os dados aqui estiverem errados, o problema **não é** neste componente. Ele apenas exibe os dados. A causa raiz estará na tela de distribuição (`DistributionScreen.jsx`) ou nos cálculos do backend.

---

Este guia é um documento vivo. Conforme o projeto evolui, ele deve ser atualizado. Use-o como sua bússola para navegar na codebase. Entender o fluxo de dados — desde a interação do usuário no frontend, passando pela requisição de API, até a lógica no backend e a resposta de volta — é a chave para ser um desenvolvedor eficaz neste projeto. Boa sorte!
