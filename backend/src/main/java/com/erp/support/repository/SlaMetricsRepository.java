package com.erp.support.repository;
import com.erp.support.entity.SlaMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SlaMetricsRepository extends JpaRepository<SlaMetrics, Long> {
    Optional<SlaMetrics> findByTicketId(Long ticketId);
}
