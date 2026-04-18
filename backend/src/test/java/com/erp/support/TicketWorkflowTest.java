package com.erp.support;

import com.erp.support.entity.*;
import com.erp.support.enums.*;
import com.erp.support.enums.AppModule;
import com.erp.support.exception.InvalidTransitionException;
import com.erp.support.repository.*;
import com.erp.support.service.*;
import com.erp.support.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketWorkflowTest {

    @Mock TicketRepository ticketRepo;
    @Mock UserRepository userRepo;
    @Mock TicketCommentRepository commentRepo;
    @Mock SlaService slaService;
    @Mock DtoMapper mapper;

    @InjectMocks TicketService ticketService;

    private User agent;
    private User requester;
    private Ticket ticket;

    @BeforeEach
    void setup() {
        agent = User.builder().id(2L).email("agent@erp.com")
                .fullName("Alice Agent").role(UserRole.AGENT).active(true).build();

        requester = User.builder().id(3L).email("req@erp.com")
                .fullName("Bob Req").role(UserRole.REQUESTER).active(true).build();

        ticket = Ticket.builder()
                .id(1L).title("Test ticket").description("desc")
                .status(TicketStatus.NEW).priority(Priority.P2)
                .appModule(AppModule.FINANCE).createdBy(requester)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();
    }

    // ── Valid transitions ───────────────────────────────────────────────────

    @Test
    void newToAssigned_isValid() {
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toDetail(any(), any(), any())).thenReturn(new TicketDetailDto());

        assertThatNoException().isThrownBy(() ->
            ticketService.updateStatus(1L, TicketStatus.ASSIGNED, agent));

        verify(ticketRepo).save(argThat(t -> t.getStatus() == TicketStatus.ASSIGNED));
    }

    @Test
    void assignedToInProgress_isValid() {
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setAssignedTo(agent);
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toDetail(any(), any(), any())).thenReturn(new TicketDetailDto());

        assertThatNoException().isThrownBy(() ->
            ticketService.updateStatus(1L, TicketStatus.IN_PROGRESS, agent));
    }

    @Test
    void inProgressToResolved_setsResolvedAt() {
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setFirstAgentActionAt(LocalDateTime.now().minusMinutes(30));
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toDetail(any(), any(), any())).thenReturn(new TicketDetailDto());

        ticketService.updateStatus(1L, TicketStatus.RESOLVED, agent);

        verify(ticketRepo).save(argThat(t ->
            t.getStatus() == TicketStatus.RESOLVED && t.getResolvedAt() != null));
        verify(slaService).computeAndSave(any());
    }

    @Test
    void waitingCustomerBackToInProgress_isValid() {
        ticket.setStatus(TicketStatus.WAITING_CUSTOMER);
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toDetail(any(), any(), any())).thenReturn(new TicketDetailDto());

        assertThatNoException().isThrownBy(() ->
            ticketService.updateStatus(1L, TicketStatus.IN_PROGRESS, agent));
    }

    // ── Invalid transitions ────────────────────────────────────────────────

    @Test
    void newDirectlyToResolved_throws() {
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(1L, TicketStatus.RESOLVED, agent))
            .isInstanceOf(InvalidTransitionException.class)
            .hasMessageContaining("NEW")
            .hasMessageContaining("RESOLVED");
    }

    @Test
    void newToInProgress_throws() {
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(1L, TicketStatus.IN_PROGRESS, agent))
            .isInstanceOf(InvalidTransitionException.class);
    }

    @Test
    void closedToAssigned_throws() {
        ticket.setStatus(TicketStatus.CLOSED);
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(1L, TicketStatus.ASSIGNED, agent))
            .isInstanceOf(InvalidTransitionException.class);
    }

    // ── First agent action recording ───────────────────────────────────────

    @Test
    void firstAgentAction_timestampSetOnFirstStatusUpdate() {
        assertThat(ticket.getFirstAgentActionAt()).isNull();
        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toDetail(any(), any(), any())).thenReturn(new TicketDetailDto());

        ticketService.updateStatus(1L, TicketStatus.ASSIGNED, agent);

        verify(ticketRepo).save(argThat(t -> t.getFirstAgentActionAt() != null));
    }

    @Test
    void firstAgentAction_notOverwrittenOnSubsequentUpdates() {
        LocalDateTime originalActionTime = LocalDateTime.now().minusHours(2);
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setFirstAgentActionAt(originalActionTime);

        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toDetail(any(), any(), any())).thenReturn(new TicketDetailDto());

        ticketService.updateStatus(1L, TicketStatus.IN_PROGRESS, agent);

        verify(ticketRepo).save(argThat(t ->
            t.getFirstAgentActionAt().equals(originalActionTime)));
    }
}
