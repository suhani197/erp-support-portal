package com.erp.support.repository;
import com.erp.support.entity.KbArticle;
import com.erp.support.enums.AppModule;
import com.erp.support.enums.KbStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface KbArticleRepository extends JpaRepository<KbArticle, Long> {
    List<KbArticle> findByStatus(KbStatus status);
    @Query("""
        SELECT a FROM KbArticle a WHERE
        (:status IS NULL OR a.status = :status) AND
        (:appModule IS NULL OR a.appModule = :appModule) AND
        (:keyword IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%',:keyword,'%'))
          OR LOWER(a.symptoms) LIKE LOWER(CONCAT('%',:keyword,'%')))
    """)
    List<KbArticle> search(@Param("status") KbStatus status,
                           @Param("appModule") AppModule appModule,
                           @Param("keyword") String keyword);
}
