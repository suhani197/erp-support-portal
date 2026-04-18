package com.erp.support.service;

import com.erp.support.entity.*;
import com.erp.support.enums.Priority;
import com.erp.support.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SlaService {

    private final SlaMetricsRepository metricsRepo;
    private final SlaPolicyRepository policyRepo;

    @Transactional
    public void computeAndSave(Ticket ticket) {
        SlaPolicy policy = getPolicy(ticket.getPriority());
        if (policy == null) return;

        SlaMetrics metrics = metricsRepo.findByTicketId(ticket.getId())
                .orElse(SlaMetrics.builder().ticket(ticket).build());

        LocalDateTime created = ticket.getCreatedAt();

        // First response time
        if (ticket.getFirstAgentActionAt() != null) {
            long firstResponseMins = Duration.between(created, ticket.getFirstAgentActionAt()).toMinutes();
            metrics.setFirstResponseMinutes((int) firstResponseMins);
            metrics.setFirstResponseBreached(firstResponseMins > policy.getFirstResponseMinutes());
        }

        // Resolution time
        if (ticket.getResolvedAt() != null) {
            long resolutionMins = Duration.between(created, ticket.getResolvedAt()).toMinutes();
            metrics.setResolutionMinutes((int) resolutionMins);
            metrics.setResolutionBreached(resolutionMins > policy.getResolutionMinutes());
        }

        metrics.setComputedAt(LocalDateTime.now());
        metricsRepo.save(metrics);
    }

    public SlaMetrics getMetrics(Long ticketId) {
        return metricsRepo.findByTicketId(ticketId).orElse(null);
    }

    public SlaPolicy getPolicy(Priority priority) {
        return policyRepo.findByPriority(priority).orElse(null);
    }
}
