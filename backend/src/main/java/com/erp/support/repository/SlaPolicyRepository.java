package com.erp.support.repository;
import com.erp.support.entity.SlaPolicy;
import com.erp.support.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {
    Optional<SlaPolicy> findByPriority(Priority priority);
}
