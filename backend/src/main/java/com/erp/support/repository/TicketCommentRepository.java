package com.erp.support.repository;
import com.erp.support.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
