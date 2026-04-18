package com.erp.support.service;

import com.erp.support.dto.*;
import com.erp.support.entity.*;
import com.erp.support.enums.*;
import com.erp.support.enums.AppModule;
import com.erp.support.exception.*;
import com.erp.support.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TicketService {

    // Allowed transitions: from -> set of valid next statuses
    private static final Map<TicketStatus, Set<TicketStatus>> TRANSITIONS = Map.of(
        TicketStatus.NEW,              Set.of(TicketStatus.ASSIGNED),
        TicketStatus.ASSIGNED,         Set.of(TicketStatus.IN_PROGRESS),
        TicketStatus.IN_PROGRESS,      Set.of(TicketStatus.WAITING_CUSTOMER, TicketStatus.RESOLVED),
        TicketStatus.WAITING_CUSTOMER, Set.of(TicketStatus.IN_PROGRESS),
        TicketStatus.RESOLVED,         Set.of(TicketStatus.CLOSED),
        TicketStatus.CLOSED,           Set.of(TicketStatus.IN_PROGRESS)
    );

    private final TicketRepository ticketRepo;
    private final UserRepository userRepo;
    private final TicketCommentRepository commentRepo;
    private final SlaService slaService;
    private final DtoMapper mapper;

    @Transactional
    public TicketDetailDto createTicket(CreateTicketRequest req, User currentUser) {
        var ticket = Ticket.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .priority(req.getPriority())
                .appModule(req.getAppModule())
                .status(TicketStatus.NEW)
                .createdBy(currentUser)
                .build();
        ticket = ticketRepo.save(ticket);
        return mapper.toDetail(ticket, null, null);
    }

    @Transactional(readOnly = true)
    public Page<TicketSummaryDto> listTickets(TicketStatus status, Priority priority,
                                              AppModule AppModule, Long assignedToId,
                                              Long createdById, int page, int size,
                                              User currentUser) {
        // Requesters can only see their own tickets
        Long effectiveCreatedById = currentUser.getRole() == UserRole.REQUESTER
                ? currentUser.getId()
                : createdById;

        return ticketRepo.findWithFilters(
                status, priority, AppModule, assignedToId, effectiveCreatedById,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).map(mapper::toSummary);
    }

    @Transactional(readOnly = true)
    public TicketDetailDto getTicket(Long id, User currentUser) {
        Ticket ticket = findTicket(id);
        // Requesters can only view their own tickets
        if (currentUser.getRole() == UserRole.REQUESTER
                && !ticket.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Not your ticket");
        }
        var sla = slaService.getMetrics(id);
        var policy = sla != null ? slaService.getPolicy(ticket.getPriority()) : null;
        return mapper.toDetail(ticket, sla, policy);
    }

    @Transactional
    public TicketDetailDto updateStatus(Long id, TicketStatus newStatus, User currentUser) {
        Ticket ticket = findTicket(id);
        TicketStatus current = ticket.getStatus();

        Set<TicketStatus> allowed = TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowed.contains(newStatus)) {
            throw new InvalidTransitionException(
                "Cannot transition from " + current + " to " + newStatus +
                ". Allowed: " + allowed
            );
        }

        // Record first agent action
        if (ticket.getFirstAgentActionAt() == null
                && currentUser.getRole() != UserRole.REQUESTER) {
            ticket.setFirstAgentActionAt(LocalDateTime.now());
        }

        if (newStatus == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }
        if (newStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        ticket.setStatus(newStatus);
        ticket = ticketRepo.save(ticket);

        // Compute SLA when first agent acts or ticket is resolved
        if (ticket.getFirstAgentActionAt() != null || newStatus == TicketStatus.RESOLVED) {
            slaService.computeAndSave(ticket);
        }

        return mapper.toDetail(ticket,
                slaService.getMetrics(id),
                slaService.getPolicy(ticket.getPriority()));
    }

    @Transactional
    public TicketDetailDto assignTicket(Long id, Long agentId, User currentUser) {
        Ticket ticket = findTicket(id);
        User agent = userRepo.findById(agentId)
                .filter(u -> u.getRole() == UserRole.AGENT || u.getRole() == UserRole.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + agentId));

        ticket.setAssignedTo(agent);
        if (ticket.getStatus() == TicketStatus.NEW) {
            ticket.setStatus(TicketStatus.ASSIGNED);
        }
        ticket = ticketRepo.save(ticket);
        return mapper.toDetail(ticket, slaService.getMetrics(id), slaService.getPolicy(ticket.getPriority()));
    }

    @Transactional
    public CommentDto addComment(Long ticketId, AddCommentRequest req, User currentUser) {
        Ticket ticket = findTicket(ticketId);

        // Requesters can only comment on their own tickets, always PUBLIC
        if (currentUser.getRole() == UserRole.REQUESTER) {
            if (!ticket.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Not your ticket");
            }
            req.setCommentType(CommentType.PUBLIC);
        }

        // Record first agent action on first agent comment
        if (currentUser.getRole() != UserRole.REQUESTER
                && ticket.getFirstAgentActionAt() == null) {
            ticket.setFirstAgentActionAt(LocalDateTime.now());
            ticketRepo.save(ticket);
            slaService.computeAndSave(ticket);
        }

        var comment = TicketComment.builder()
                .ticket(ticket)
                .author(currentUser)
                .body(req.getBody())
                .commentType(req.getCommentType())
                .build();
        comment = commentRepo.save(comment);
        return mapper.toCommentDto(comment);
    }

    private Ticket findTicket(Long id) {
        return ticketRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + id));
    }
}
