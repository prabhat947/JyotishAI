-- Create hybrid search function combining vector similarity and full-text search
CREATE OR REPLACE FUNCTION search_report_chunks(
    p_profile_id UUID,
    p_query_embedding vector(1536),
    p_query_text TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    report_id UUID,
    similarity FLOAT,
    ts_rank FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        rc.id,
        rc.content,
        rc.metadata,
        rc.report_id,
        1 - (rc.embedding <=> p_query_embedding) AS similarity,
        ts_rank(to_tsvector('english', rc.content),
                plainto_tsquery('english', p_query_text)) AS ts_rank,
        (0.7 * (1 - (rc.embedding <=> p_query_embedding))) +
        (0.3 * ts_rank(to_tsvector('english', rc.content),
                plainto_tsquery('english', p_query_text))) AS combined_score
    FROM report_chunks rc
    WHERE rc.profile_id = p_profile_id
    ORDER BY combined_score DESC
    LIMIT p_limit;
END;
$$;
