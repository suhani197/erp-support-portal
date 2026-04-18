package com.erp.support;

import com.erp.support.entity.*;
import com.erp.support.enums.*;
import com.erp.support.repository.*;
import com.erp.support.service.SlaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SlaServiceTest {

    @Mock SlaMetricsRepository metricsRepo;
    @Mock SlaPolicyRepository policyRepo;

    @InjectMocks SlaService slaService;

    private SlaPolicy p2Policy;
    private Ticket ticket;

    @BeforeEach
    void setup() {
        p2Policy = SlaPolicy.builder()
                .priority(Priority.P2)
                .firstResponseMinutes(240)   // 4h
                .resolutionMinutes(1440)      // 24h
                .build();

        ticket = Ticket.builder()
                .id(1L).priority(Priority.P2)
                .createdAt(LocalDateTime.now().minusHours(3))
                .build();
    }

    @Test
    void firstResponseWithinSla_notBreached() {
        // First agent action 30 minutes after creation (well within 240 min P2 policy)
        ticket.setFirstAgentActionAt(ticket.getCreatedAt().plusMinutes(30));

        when(policyRepo.findByPriority(Priority.P2)).thenReturn(Optional.of(p2Policy));
        when(metricsRepo.findByTicketId(1L)).thenReturn(Optional.empty());
        when(metricsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        slaService.computeAndSave(ticket);

        verify(metricsRepo).save(argThat(m ->
            m.getFirstResponseMinutes() == 30 &&
            !m.isFirstResponseBreached()
        ));
    }

    @Test
    void firstResponseExceedsSla_breached() {
        // First agent action 300 min after creation (over 240 min P2 threshold)
        ticket.setFirstAgentActionAt(ticket.getCreatedAt().plusMinutes(300));

        when(policyRepo.findByPriority(Priority.P2)).thenReturn(Optional.of(p2Policy));
        when(metricsRepo.findByTicketId(1L)).thenReturn(Optional.empty());
        when(metricsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        slaService.computeAndSave(ticket);

        verify(metricsRepo).save(argThat(m ->
            m.getFirstResponseMinutes() == 300 &&
            m.isFirstResponseBreached()
        ));
    }

    @Test
    void resolutionWithinSla_notBreached() {
        // Resolved in 12 hours (720 min), P2 target is 1440 min
        ticket.setFirstAgentActionAt(ticket.getCreatedAt().plusMinutes(30));
        ticket.setResolvedAt(ticket.getCreatedAt().plusMinutes(720));

        when(policyRepo.findByPriority(Priority.P2)).thenReturn(Optional.of(p2Policy));
        when(metricsRepo.findByTicketId(1L)).thenReturn(Optional.empty());
        when(metricsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        slaService.computeAndSave(ticket);

        verify(metricsRepo).save(argThat(m ->
            m.getResolutionMinutes() == 720 &&
            !m.isResolutionBreached()
        ));
    }

    @Test
    void resolutionExceedsSla_breached() {
        // Resolved in 30 hours = 1800 min, over P2 1440 min limit
        ticket.setFirstAgentActionAt(ticket.getCreatedAt().plusMinutes(30));
        ticket.setResolvedAt(ticket.getCreatedAt().plusMinutes(1800));

        when(policyRepo.findByPriority(Priority.P2)).thenReturn(Optional.of(p2Policy));
        when(metricsRepo.findByTicketId(1L)).thenReturn(Optional.empty());
        when(metricsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        slaService.computeAndSave(ticket);

        verify(metricsRepo).save(argThat(m ->
            m.getResolutionMinutes() == 1800 &&
            m.isResolutionBreached()
        ));
    }

    @Test
    void noFirstResponseYet_metricsHaveNullFirstResponse() {
        // No firstAgentActionAt set — ticket just created, no agent action yet
        when(policyRepo.findByPriority(Priority.P2)).thenReturn(Optional.of(p2Policy));
        when(metricsRepo.findByTicketId(1L)).thenReturn(Optional.empty());
        when(metricsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        slaService.computeAndSave(ticket);

        verify(metricsRepo).save(argThat(m ->
            m.getFirstResponseMinutes() == null &&
            !m.isFirstResponseBreached()
        ));
    }

    @Test
    void existingMetrics_areUpdatedNotDuplicated() {
        SlaMetrics existing = SlaMetrics.builder()
                .ticket(ticket)
                .firstResponseMinutes(50)
                .firstResponseBreached(false)
                .build();

        ticket.setFirstAgentActionAt(ticket.getCreatedAt().plusMinutes(50));
        ticket.setResolvedAt(ticket.getCreatedAt().plusMinutes(600));

        when(policyRepo.findByPriority(Priority.P2)).thenReturn(Optional.of(p2Policy));
        when(metricsRepo.findByTicketId(1L)).thenReturn(Optional.of(existing));
        when(metricsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        slaService.computeAndSave(ticket);

        // Should update the existing record, not create a new one
        verify(metricsRepo, times(1)).save(argThat(m ->
            m.getResolutionMinutes() == 600
        ));
    }
}
