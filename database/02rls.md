-- ============================================
-- CompartilhaAI - Políticas de Segurança (RLS)
-- Execute este arquivo DEPOIS do 01_schema.sql
-- ============================================

-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atribuicoes ENABLE ROW LEVEL SECURITY;


-- ============================================
-- POLÍTICAS: profiles
-- Usuário só vê/edita seu próprio perfil
-- ============================================

-- SELECT: usuário vê apenas seu perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- UPDATE: usuário edita apenas seu perfil
CREATE POLICY "Usuários podem editar seu próprio perfil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT: perfil é criado automaticamente pelo trigger
-- Não precisa de política pois o trigger usa SECURITY DEFINER


-- ============================================
-- POLÍTICAS: divisoes
-- Usuário só vê/edita suas próprias divisões
-- ============================================

-- SELECT: usuário vê apenas suas divisões
CREATE POLICY "Usuários podem ver suas divisões"
    ON divisoes FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: usuário cria divisões para si mesmo
CREATE POLICY "Usuários podem criar divisões"
    ON divisoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuário edita apenas suas divisões
CREATE POLICY "Usuários podem editar suas divisões"
    ON divisoes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: usuário deleta apenas suas divisões
CREATE POLICY "Usuários podem deletar suas divisões"
    ON divisoes FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================
-- POLÍTICAS: itens
-- Usuário só vê/edita itens de suas divisões
-- ============================================

-- SELECT: usuário vê itens de suas divisões
CREATE POLICY "Usuários podem ver itens de suas divisões"
    ON itens FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = itens.divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- INSERT: usuário adiciona itens em suas divisões
CREATE POLICY "Usuários podem adicionar itens em suas divisões"
    ON itens FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- UPDATE: usuário edita itens de suas divisões
CREATE POLICY "Usuários podem editar itens de suas divisões"
    ON itens FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = itens.divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- DELETE: usuário deleta itens de suas divisões
CREATE POLICY "Usuários podem deletar itens de suas divisões"
    ON itens FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = itens.divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );


-- ============================================
-- POLÍTICAS: pessoas
-- Usuário só vê/edita pessoas de suas divisões
-- ============================================

-- SELECT
CREATE POLICY "Usuários podem ver pessoas de suas divisões"
    ON pessoas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = pessoas.divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- INSERT
CREATE POLICY "Usuários podem adicionar pessoas em suas divisões"
    ON pessoas FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- UPDATE
CREATE POLICY "Usuários podem editar pessoas de suas divisões"
    ON pessoas FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = pessoas.divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- DELETE
CREATE POLICY "Usuários podem deletar pessoas de suas divisões"
    ON pessoas FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM divisoes
            WHERE divisoes.id = pessoas.divisao_id
            AND divisoes.user_id = auth.uid()
        )
    );


-- ============================================
-- POLÍTICAS: atribuicoes
-- Usuário só vê/edita atribuições de suas divisões
-- ============================================

-- SELECT
CREATE POLICY "Usuários podem ver atribuições de suas divisões"
    ON atribuicoes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM itens
            JOIN divisoes ON divisoes.id = itens.divisao_id
            WHERE itens.id = atribuicoes.item_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- INSERT
CREATE POLICY "Usuários podem criar atribuições em suas divisões"
    ON atribuicoes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM itens
            JOIN divisoes ON divisoes.id = itens.divisao_id
            WHERE itens.id = item_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- UPDATE
CREATE POLICY "Usuários podem editar atribuições de suas divisões"
    ON atribuicoes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM itens
            JOIN divisoes ON divisoes.id = itens.divisao_id
            WHERE itens.id = atribuicoes.item_id
            AND divisoes.user_id = auth.uid()
        )
    );

-- DELETE
CREATE POLICY "Usuários podem deletar atribuições de suas divisões"
    ON atribuicoes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM itens
            JOIN divisoes ON divisoes.id = itens.divisao_id
            WHERE itens.id = atribuicoes.item_id
            AND divisoes.user_id = auth.uid()
        )
    );


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS criadas com sucesso!';
    RAISE NOTICE 'Todas as tabelas estão protegidas por Row Level Security';
    RAISE NOTICE 'Próximo passo: Execute o arquivo 03_functions.sql (opcional)';
END $$;