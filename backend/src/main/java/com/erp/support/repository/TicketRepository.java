package com.erp.support.repository;

import com.erp.support.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query(value = """
        SELECT * FROM tickets t
        WHERE (:status IS NULL OR t.status = CAST(:status AS ticket_status))
          AND (:priority IS NULL OR t.priority = CAST(:priority AS ticket_priority))
          AND (:appModule IS NULL OR t.module = CAST(:appModule AS ticket_module))
          AND (
              :assignedToId IS NULL
              OR (:assignedToId = -1 AND t.assigned_to_id IS NULL)
              OR (:assignedToId <> -1 AND t.assigned_to_id = :assignedToId)
          )
          AND (:createdById IS NULL OR t.created_by_id = :createdById)
        ORDER BY t.created_at DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM tickets t
        WHERE (:status IS NULL OR t.status = CAST(:status AS ticket_status))
          AND (:priority IS NULL OR t.priority = CAST(:priority AS ticket_priority))
          AND (:appModule IS NULL OR t.module = CAST(:appModule AS ticket_module))
          AND (
              :assignedToId IS NULL
              OR (:assignedToId = -1 AND t.assigned_to_id IS NULL)
              OR (:assignedToId <> -1 AND t.assigned_to_id = :assignedToId)
          )
          AND (:createdById IS NULL OR t.created_by_id = :createdById)
        """,
        nativeQuery = true)
    Page<Ticket> findWithFilters(
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("appModule") String appModule,
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