package com.erp.support.repository;
import com.erp.support.entity.KbArticle;
import com.erp.support.enums.KbStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface KbArticleRepository extends JpaRepository<KbArticle, Long> {
    List<KbArticle> findByStatus(KbStatus status);
    
    @Query(value = """
        SELECT * FROM kb_articles ka WHERE
        (?1 IS NULL OR ka.status = CAST(?1 AS kb_status)) AND
        (?2 IS NULL OR ka.module = CAST(?2 AS ticket_module)) AND
        (?3 IS NULL OR ka.title ILIKE '%' || ?3 || '%' OR ka.symptoms ILIKE '%' || ?3 || '%')
        """, nativeQuery = true)
    List<KbArticle> search(String status, String appModule, String keyword);
}
