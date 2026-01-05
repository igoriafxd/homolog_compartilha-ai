-- ============================================
-- CompartilhaAI - Funções Auxiliares
-- Execute este arquivo DEPOIS do 02_rls.sql
-- ============================================

-- ============================================
-- FUNÇÃO: Calcular totais de uma divisão
-- Retorna o total de cada pessoa com taxa e desconto
-- ============================================
CREATE OR REPLACE FUNCTION calcular_totais_divisao(p_divisao_id UUID)
RETURNS TABLE (
    pessoa_id UUID,
    pessoa_nome TEXT,
    subtotal DECIMAL,
    desconto DECIMAL,
    taxa DECIMAL,
    total DECIMAL,
    percentual_da_conta DECIMAL
) AS $$
DECLARE
    v_taxa_servico DECIMAL;
    v_desconto_valor DECIMAL;
    v_subtotal_geral DECIMAL;
    v_total_geral DECIMAL;
BEGIN
    -- Busca configurações da divisão
    SELECT 
        taxa_servico_percentual, 
        desconto_valor 
    INTO v_taxa_servico, v_desconto_valor
    FROM divisoes 
    WHERE id = p_divisao_id;
    
    -- Calcula subtotal geral (soma de todos os itens)
    SELECT COALESCE(SUM(quantidade * valor_unitario), 0)
    INTO v_subtotal_geral
    FROM itens
    WHERE divisao_id = p_divisao_id;
    
    -- Calcula total geral com desconto e taxa
    v_total_geral := (v_subtotal_geral - v_desconto_valor) * (1 + v_taxa_servico / 100);
    
    -- Retorna totais por pessoa
    RETURN QUERY
    SELECT 
        p.id AS pessoa_id,
        p.nome AS pessoa_nome,
        COALESCE(SUM(a.quantidade * i.valor_unitario), 0) AS subtotal,
        CASE 
            WHEN v_subtotal_geral > 0 
            THEN (COALESCE(SUM(a.quantidade * i.valor_unitario), 0) / v_subtotal_geral) * v_desconto_valor
            ELSE 0
        END AS desconto,
        CASE 
            WHEN v_subtotal_geral > 0 
            THEN ((COALESCE(SUM(a.quantidade * i.valor_unitario), 0) - 
                  (COALESCE(SUM(a.quantidade * i.valor_unitario), 0) / v_subtotal_geral) * v_desconto_valor) 
                  * v_taxa_servico / 100)
            ELSE 0
        END AS taxa,
        CASE 
            WHEN v_subtotal_geral > 0 
            THEN (COALESCE(SUM(a.quantidade * i.valor_unitario), 0) - 
                  (COALESCE(SUM(a.quantidade * i.valor_unitario), 0) / v_subtotal_geral) * v_desconto_valor) 
                  * (1 + v_taxa_servico / 100)
            ELSE 0
        END AS total,
        CASE 
            WHEN v_total_geral > 0 
            THEN ((COALESCE(SUM(a.quantidade * i.valor_unitario), 0) - 
                   (COALESCE(SUM(a.quantidade * i.valor_unitario), 0) / v_subtotal_geral) * v_desconto_valor) 
                   * (1 + v_taxa_servico / 100) / v_total_geral * 100)
            ELSE 0
        END AS percentual_da_conta
    FROM pessoas p
    LEFT JOIN atribuicoes a ON a.pessoa_id = p.id
    LEFT JOIN itens i ON i.id = a.item_id
    WHERE p.divisao_id = p_divisao_id
    GROUP BY p.id, p.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FUNÇÃO: Progresso da distribuição
-- Retorna % distribuído e itens restantes
-- ============================================
CREATE OR REPLACE FUNCTION progresso_divisao(p_divisao_id UUID)
RETURNS TABLE (
    percentual_distribuido DECIMAL,
    itens_restantes INTEGER,
    itens_total INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN SUM(i.quantidade) > 0 
            THEN (COALESCE(SUM(a.quantidade), 0) / SUM(i.quantidade) * 100)
            ELSE 0
        END AS percentual_distribuido,
        COUNT(DISTINCT CASE 
            WHEN i.quantidade > COALESCE(
                (SELECT SUM(a2.quantidade) FROM atribuicoes a2 WHERE a2.item_id = i.id), 0
            ) THEN i.id 
        END)::INTEGER AS itens_restantes,
        COUNT(DISTINCT i.id)::INTEGER AS itens_total
    FROM itens i
    LEFT JOIN atribuicoes a ON a.item_id = i.id
    WHERE i.divisao_id = p_divisao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FUNÇÃO: Duplicar divisão (criar cópia)
-- Útil para reutilizar estrutura de uma divisão
-- ============================================
CREATE OR REPLACE FUNCTION duplicar_divisao(
    p_divisao_id UUID,
    p_novo_nome TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_nova_divisao_id UUID;
    v_user_id UUID;
    v_nome_original TEXT;
BEGIN
    -- Busca dados da divisão original
    SELECT user_id, nome INTO v_user_id, v_nome_original
    FROM divisoes WHERE id = p_divisao_id;
    
    -- Verifica permissão
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Sem permissão para duplicar esta divisão';
    END IF;
    
    -- Cria nova divisão
    INSERT INTO divisoes (user_id, nome, taxa_servico_percentual, desconto_valor)
    SELECT 
        user_id, 
        COALESCE(p_novo_nome, nome || ' (cópia)'),
        taxa_servico_percentual,
        desconto_valor
    FROM divisoes WHERE id = p_divisao_id
    RETURNING id INTO v_nova_divisao_id;
    
    -- Copia pessoas
    INSERT INTO pessoas (divisao_id, nome)
    SELECT v_nova_divisao_id, nome
    FROM pessoas WHERE divisao_id = p_divisao_id;
    
    -- Copia itens
    INSERT INTO itens (divisao_id, nome, quantidade, valor_unitario, ordem)
    SELECT v_nova_divisao_id, nome, quantidade, valor_unitario, ordem
    FROM itens WHERE divisao_id = p_divisao_id;
    
    -- Nota: atribuições NÃO são copiadas (usuário redistribui)
    
    RETURN v_nova_divisao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FUNÇÃO: Limpar atribuições de um item
-- ============================================
CREATE OR REPLACE FUNCTION limpar_atribuicoes_item(p_item_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verifica permissão
    IF NOT EXISTS (
        SELECT 1 FROM itens i
        JOIN divisoes d ON d.id = i.divisao_id
        WHERE i.id = p_item_id AND d.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este item';
    END IF;
    
    DELETE FROM atribuicoes WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FUNÇÃO: Finalizar divisão
-- ============================================
CREATE OR REPLACE FUNCTION finalizar_divisao(p_divisao_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE divisoes
    SET 
        status = 'finalizada',
        finalizada_at = NOW()
    WHERE id = p_divisao_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Divisão não encontrada ou sem permissão';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Funções auxiliares criadas com sucesso!';
    RAISE NOTICE 'Funções disponíveis:';
    RAISE NOTICE '  - calcular_totais_divisao(divisao_id)';
    RAISE NOTICE '  - progresso_divisao(divisao_id)';
    RAISE NOTICE '  - duplicar_divisao(divisao_id, novo_nome)';
    RAISE NOTICE '  - limpar_atribuicoes_item(item_id)';
    RAISE NOTICE '  - finalizar_divisao(divisao_id)';
END $$;