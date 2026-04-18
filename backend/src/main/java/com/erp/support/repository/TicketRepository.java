package com.erp.support.repository;

import com.erp.support.entity.Ticket;
import com.erp.support.enums.AppModule;
import com.erp.support.enums.Priority;
import com.erp.support.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("""
        SELECT t FROM Ticket t
        WHERE (:status IS NULL OR t.status = :status)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:appModule IS NULL OR t.appModule = :appModule)
          AND (
          :assignedToId IS NULL
          OR (:assignedToId = -1 AND t.assignedTo IS NULL)
          OR (:assignedToId <> -1 AND t.assignedTo.id = :assignedToId)
          )
          AND (:createdById IS NULL OR t.createdBy.id = :createdById)
        ORDER BY t.createdAt DESC
    """)
    Page<Ticket> findWithFilters(
            @Param("status") TicketStatus status,
            @Param("priority") Priority priority,
            @Param("appModule") AppModule appModule,
            @Param("assignedToId") Long assignedToId,
            @Param("createdById") Long createdById,
            Pageable pageable);

    @Query("SELECT t.status, COUNT(t) FROM Ticket t GROUP BY t.status")
    List<Object[]> countByStatus();

    @Query("SELECT t.priority, t.appModule, COUNT(t) FROM Ticket t GROUP BY t.priority, t.appModule")
    List<Object[]> countByPriorityAndModule();

    @Query("""
        SELECT t.assignedTo.id, t.assignedTo.fullName, COUNT(t)
        FROM Ticket t
        WHERE t.assignedTo IS NOT NULL
          AND t.status NOT IN (com.erp.support.enums.TicketStatus.RESOLVED, com.erp.support.enums.TicketStatus.CLOSED)
        GROUP BY t.assignedTo.id, t.assignedTo.fullName
    """)
    List<Object[]> agentOpenTicketCounts();
}