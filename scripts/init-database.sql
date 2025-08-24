-- Script de inicialização do banco de dados SQLite
-- Este script será executado automaticamente se as tabelas não existirem

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_produto TEXT UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    saldo_estoque INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de códigos de barras
CREATE TABLE IF NOT EXISTS codigos_de_barras (
    codigo_de_barras TEXT PRIMARY KEY,
    produto_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de contagens
CREATE TABLE IF NOT EXISTS contagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    data_contagem DATETIME DEFAULT CURRENT_TIMESTAMP,
    local_estoque TEXT DEFAULT 'loja-1',
    status TEXT DEFAULT 'em_andamento',
    observacoes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de itens contados
CREATE TABLE IF NOT EXISTS itens_contados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contagem_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    codigo_de_barras TEXT NOT NULL,
    quantidade_contada INTEGER NOT NULL,
    saldo_estoque INTEGER NOT NULL,
    total INTEGER NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contagem_id) REFERENCES contagens(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (codigo_de_barras) REFERENCES codigos_de_barras(codigo_de_barras)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo_produto);
CREATE INDEX IF NOT EXISTS idx_codigos_barras ON codigos_de_barras(codigo_de_barras);
CREATE INDEX IF NOT EXISTS idx_contagens_usuario ON contagens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contagens_local ON contagens(local_estoque);
CREATE INDEX IF NOT EXISTS idx_itens_contagem ON itens_contados(contagem_id);

-- Inserir usuário padrão (senha: admin123)
INSERT OR IGNORE INTO usuarios (email, senha_hash) 
VALUES ('admin@sistema.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx/LBvFS');

-- Inserir produtos de exemplo
INSERT OR IGNORE INTO produtos (codigo_produto, descricao, saldo_estoque) VALUES
('113639', 'AGUA H2O LIMONETO 500ML', 50),
('113640', 'REFRIGERANTE COLA 350ML', 30),
('113641', 'SUCO LARANJA 1L', 25),
('113642', 'BISCOITO CHOCOLATE 200G', 40),
('113643', 'LEITE INTEGRAL 1L', 35),
('113644', 'CAFE TORRADO 500G', 20),
('113645', 'AÇUCAR CRISTAL 1KG', 60),
('113646', 'ARROZ BRANCO 5KG', 15),
('113647', 'FEIJAO PRETO 1KG', 25),
('113648', 'MACARRAO ESPAGUETE 500G', 45);

-- Inserir códigos de barras de exemplo
INSERT OR IGNORE INTO codigos_de_barras (codigo_de_barras, produto_id) VALUES
('7892840812850', 1),
('7892840812851', 2),
('7892840812852', 3),
('7892840812853', 4),
('7892840812854', 5),
('7892840812855', 6),
('7892840812856', 7),
('7892840812857', 8),
('7892840812858', 9),
('7892840812859', 10);
