package com.erp.support.service;

import com.erp.support.dto.*;
import com.erp.support.entity.SlaMetrics;
import com.erp.support.enums.TicketStatus;
import com.erp.support.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TicketRepository ticketRepo;
    private final SlaMetricsRepository slaMetricsRepo;
    private final SlaPolicyRepository slaPolicyRepo;

    public DashboardSummaryDto getSummary() {
        var dto = new DashboardSummaryDto();

        // Count by status
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : ticketRepo.countByStatus()) {
            byStatus.put(row[0].toString(), (Long) row[1]);
        }
        dto.setTicketsByStatus(byStatus);

        // Count by priority
        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (Object[] row : ticketRepo.countByPriorityAndModule()) {
            String key = row[0] + "/" + row[1];
            byPriority.put(key, (Long) row[2]);
        }
        dto.setTicketsByPriority(byPriority);

        // Total open
        long totalOpen = byStatus.entrySet().stream()
                .filter(e -> !e.getKey().equals("RESOLVED") && !e.getKey().equals("CLOSED"))
                .mapToLong(Map.Entry::getValue).sum();
        dto.setTotalOpen(totalOpen);

        // SLA metrics
        List<SlaMetrics> allMetrics = slaMetricsRepo.findAll();
        long breached = allMetrics.stream()
                .filter(m -> m.isFirstResponseBreached() || m.isResolutionBreached()).count();
        dto.setSlaBreachCount(breached);

        double compliance = allMetrics.isEmpty() ? 100.0
                : (double)(allMetrics.size() - breached) / allMetrics.size() * 100.0;
        dto.setSlaCompliancePct(Math.round(compliance * 10.0) / 10.0);

        OptionalDouble avgFirst = allMetrics.stream()
                .filter(m -> m.getFirstResponseMinutes() != null)
                .mapToInt(SlaMetrics::getFirstResponseMinutes).average();
        dto.setAvgFirstResponseMinutes(avgFirst.isPresent()
                ? Math.round(avgFirst.getAsDouble() * 10.0) / 10.0 : null);

        OptionalDouble avgRes = allMetrics.stream()
                .filter(m -> m.getResolutionMinutes() != null)
                .mapToInt(SlaMetrics::getResolutionMinutes).average();
        dto.setAvgResolutionMinutes(avgRes.isPresent()
                ? Math.round(avgRes.getAsDouble() * 10.0) / 10.0 : null);

        return dto;
    }

    public List<AgentWorkloadDto> getAgentWorkload() {
        return ticketRepo.agentOpenTicketCounts().stream()
                .map(row -> {
                    var dto = new AgentWorkloadDto();
                    dto.setAgentId((Long) row[0]);
                    dto.setAgentName((String) row[1]);
                    dto.setOpenTickets((Long) row[2]);
                    return dto;
                }).toList();
    }
}
