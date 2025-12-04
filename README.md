# MechManager - Sistema de Gestão de Oficina Mecânica (Fullstack Moderno)

## Visão Geral

O MechManager é uma aplicação web completa para a gestão de oficinas mecânicas, reimplementada com recurso a uma arquitetura moderna e desacoplada (API REST + SPA).

O sistema permite que Administradores façam a gestão do fluxo da oficina (Ordens de Serviço, Stock, Mecânicos e Faturação) e que Clientes acompanhem o estado das suas viaturas, aprovem orçamentos e visualizem o histórico de manutenções com fotografias e detalhes financeiros.

---

## Tecnologias Utilizadas

### Backend (API)

- **Linguagem:** Python 3.10+
- **Framework:** FastAPI
- **Base de Dados:** SQLite + SQLModel (ORM)
- **Autenticação:** JWT (JSON Web Tokens) com OAuth2
- **Segurança:** Passlib com Bcrypt para hash de palavras-passe

### Frontend (Interface)

- **Framework:** React.js (Vite)
- **Estilos:** Bootstrap 5 + CSS Personalizado
- **Comunicação:** Axios para consumo da API
- **Navegação:** React Router Dom

---

## Funcionalidades Principais

### Painel Administrativo

- **Dashboard:** Gráficos de faturação, contagem de viaturas e serviços pendentes.
- **Gestão de OS:** Criação de orçamentos, adição de peças e controlo de estados (Aberto, Em Andamento, Concluído).
- **Acompanhamento Visual:** Carregamento de fotografias do progresso do serviço (Antes/Depois) vinculadas à ordem.
- **Controlo de Stock:** Baixa automática de peças e serviços ao finalizar uma OS.
- **Integração:** Botão para enviar mensagens pré-formatadas via WhatsApp para o cliente.

### Área do Cliente

- **Aprovação Digital:** O cliente pode aprovar o orçamento com um clique, alterando o estado da OS.
- **Transparência:** Visualização detalhada de peças, preços unitários, subtotais e fotografias do serviço.
- **Histórico:** Acesso ao prontuário completo de manutenções anteriores da viatura.
- **Avaliação:** Sistema de classificação (1 a 5 estrelas) e feedback após a conclusão do serviço.

### Funcionalidades Gerais

- **Impressão:** Geração de relatórios e ordens de serviço em formato limpo para impressão ou PDF.
- **Pesquisa:** Filtragem de ordens de serviço por matrícula da viatura ou nome do cliente.
- **Responsividade:** Interface adaptável para dispositivos móveis e desktops.

---

## Instalação e Execução

Este projeto deve ser executado em dois terminais separados (Backend e Frontend). Siga os passos abaixo.

### Passo 1: Configurar o Backend (Python)

1. Aceda à pasta raiz do projeto e crie um ambiente virtual:

   ```bash
   python -m venv venv

   ```

2. Ative o ambiente virtual:

   Windows: venv\Scripts\activate

   Linux/Mac: source venv/bin/activate

3. Instale as dependências necessárias:

```

    pip install fastapi uvicorn sqlmodel passlib[bcrypt] python-jose python-multipart

```

    Nota: Caso ocorra erro com o bcrypt, utilize: pip install bcrypt==3.2.0

4. Popule a base de dados com os serviços e crie o utilizador administrador:

```
    cd backend
    python import_services.py
    cd ..
```

5. Inicie o servidor:

```
uvicorn backend.main:app --reload
```

    O backend ficará disponível em: http://localhost:8000

---

### Passo 2: Configurar o Frontend (React)

1. Abra um novo terminal e aceda à pasta frontend:

```
    cd frontend

```

2. Instale as dependências do projeto:

```
    npm install
```

3. Inicie a aplicação web:

```
    npm run dev
```

O site ficará disponível em: http://localhost:5173

---

## Acesso ao Sistema

### Utilizador Administrador

- O script de importação cria automaticamente um superutilizador para gestão.

  Utilizador: admin

  Palavra-passe: admin

### Utilizador Cliente

- Novos clientes podem criar uma conta clicando em "Cadastrar" na interface de login. Utilizadores criados através do site têm perfil de cliente (apenas visualização e aprovação).

---

## Estrutura da Base de Dados

O sistema utiliza as seguintes tabelas principais:

- User: Dados de acesso e permissões (Admin/Cliente).

- Profile: Dados complementares (Telefone, Fotografia, Bio).

- Vehicle: Viaturas associadas aos clientes.

- Service: Catálogo de serviços com preços e quantidade em stock.

- WorkOrder: A ordem de serviço que conecta viatura, mecânico e estado.

- WorkItem: Itens individuais (peças/serviços) dentro de uma OS.

- WorkOrderPhoto: Imagens de acompanhamento do serviço.

Desenvolvido por: Gustavo Jose Rodrigues Pereira | Disciplina: Programação Web
