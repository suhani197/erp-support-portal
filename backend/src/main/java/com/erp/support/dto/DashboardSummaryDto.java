package com.erp.support.dto;
import lombok.Data;
import java.util.Map;
@Data public class DashboardSummaryDto {
    public Map<String, Long> ticketsByStatus;
    public Map<String, Long> ticketsByPriority;
    public long totalOpen;
    public long slaBreachCount;
    public double slaCompliancePct;
    public Double avgFirstResponseMinutes;
    public Double avgResolutionMinutes;
}
