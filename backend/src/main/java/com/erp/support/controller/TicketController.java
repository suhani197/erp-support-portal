package com.erp.support.controller;

import com.erp.support.dto.*;
import com.erp.support.entity.User;
import com.erp.support.enums.AppModule;
import com.erp.support.enums.Priority;
import com.erp.support.enums.TicketStatus;
import com.erp.support.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketDetailDto> create(
            @Valid @RequestBody CreateTicketRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(req, currentUser));
    }

    @GetMapping
    public ResponseEntity<Page<TicketSummaryDto>> list(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) AppModule AppModule,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long createdById,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.listTickets(
                status, priority, AppModule, assignedToId, createdById, page, size, currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDetailDto> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.getTicket(id, currentUser));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<TicketDetailDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.updateStatus(id, req.getStatus(), currentUser));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<TicketDetailDto> assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.assignTicket(id, req.getAgentId(), currentUser));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, req, currentUser));
    }
}
