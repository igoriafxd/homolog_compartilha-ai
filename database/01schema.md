-- ============================================
-- CompartilhaAI - Schema do Banco de Dados
-- Execute este arquivo PRIMEIRO no SQL Editor do Supabase
-- ============================================

-- ============================================
-- TABELA: profiles
-- Dados extras dos usuários (complementa auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE profiles IS 'Perfis dos usuários - dados complementares ao auth.users';
COMMENT ON COLUMN profiles.id IS 'ID do usuário (mesmo do auth.users)';
COMMENT ON COLUMN profiles.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN profiles.telefone IS 'Telefone com DDD (ex: 11999999999)';
COMMENT ON COLUMN profiles.avatar_url IS 'URL da foto de perfil no Storage';


-- ============================================
-- TABELA: divisoes
-- Sessões de divisão de conta
-- ============================================
CREATE TABLE IF NOT EXISTS divisoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nome TEXT DEFAULT 'Divisão sem nome',
    status TEXT NOT NULL DEFAULT 'em_andamento' 
        CHECK (status IN ('em_andamento', 'finalizada', 'cancelada')),
    taxa_servico_percentual DECIMAL(5,2) NOT NULL DEFAULT 10.00 
        CHECK (taxa_servico_percentual >= 0 AND taxa_servico_percentual <= 100),
    desconto_valor DECIMAL(10,2) NOT NULL DEFAULT 0.00 
        CHECK (desconto_valor >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalizada_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS divisoes_user_id_idx ON divisoes(user_id);
CREATE INDEX IF NOT EXISTS divisoes_status_idx ON divisoes(status);
CREATE INDEX IF NOT EXISTS divisoes_created_at_idx ON divisoes(created_at DESC);

-- Comentários
COMMENT ON TABLE divisoes IS 'Sessões de divisão de conta';
COMMENT ON COLUMN divisoes.status IS 'Status: em_andamento, finalizada, cancelada';
COMMENT ON COLUMN divisoes.taxa_servico_percentual IS 'Taxa de serviço em % (0-100)';
COMMENT ON COLUMN divisoes.desconto_valor IS 'Valor do desconto em R$';


-- ============================================
-- TABELA: itens
-- Itens de cada comanda
-- ============================================
CREATE TABLE IF NOT EXISTS itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    divisao_id UUID NOT NULL REFERENCES divisoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL CHECK (char_length(nome) >= 1),
    quantidade DECIMAL(10,3) NOT NULL DEFAULT 1 CHECK (quantidade >= 0),
    valor_unitario DECIMAL(10,2) NOT NULL CHECK (valor_unitario >= 0),
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS itens_divisao_id_idx ON itens(divisao_id);

-- Comentários
COMMENT ON TABLE itens IS 'Itens individuais de uma comanda';
COMMENT ON COLUMN itens.quantidade IS 'Quantidade (aceita decimal para divisão)';
COMMENT ON COLUMN itens.valor_unitario IS 'Preço unitário em R$';
COMMENT ON COLUMN itens.ordem IS 'Ordem de exibição na lista (uso futuro)';


-- ============================================
-- TABELA: pessoas
-- Participantes de cada divisão
-- ============================================
CREATE TABLE IF NOT EXISTS pessoas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    divisao_id UUID NOT NULL REFERENCES divisoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL CHECK (char_length(nome) >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS pessoas_divisao_id_idx ON pessoas(divisao_id);

-- Comentários
COMMENT ON TABLE pessoas IS 'Participantes de uma divisão (não são usuários do sistema)';


-- ============================================
-- TABELA: atribuicoes
-- Quem consumiu o quê (relação N:M)
-- ============================================
CREATE TABLE IF NOT EXISTS atribuicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
    pessoa_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    quantidade DECIMAL(10,3) NOT NULL CHECK (quantidade >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Garante que não haja duplicata de item+pessoa
    UNIQUE(item_id, pessoa_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS atribuicoes_item_id_idx ON atribuicoes(item_id);
CREATE INDEX IF NOT EXISTS atribuicoes_pessoa_id_idx ON atribuicoes(pessoa_id);

-- Comentários
COMMENT ON TABLE atribuicoes IS 'Registra quem consumiu cada item e em qual quantidade';
COMMENT ON COLUMN atribuicoes.quantidade IS 'Quantidade consumida pela pessoa';


-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at em TODAS as tabelas
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_divisoes_updated_at
    BEFORE UPDATE ON divisoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itens_updated_at
    BEFORE UPDATE ON itens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pessoas_updated_at
    BEFORE UPDATE ON pessoas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atribuicoes_updated_at
    BEFORE UPDATE ON atribuicoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- FUNÇÃO: Criar perfil automaticamente no signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, nome)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário se cadastra
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Schema criado com sucesso!';
    RAISE NOTICE 'Tabelas criadas: profiles, divisoes, itens, pessoas, atribuicoes';
    RAISE NOTICE 'Próximo passo: Execute o arquivo 02_rls.sql';
END $$;