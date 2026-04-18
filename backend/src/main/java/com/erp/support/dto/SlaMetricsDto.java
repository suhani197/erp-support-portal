package com.erp.support.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data public class SlaMetricsDto {
    public Integer firstResponseMinutes;
    public Integer resolutionMinutes;
    public boolean firstResponseBreached;
    public boolean resolutionBreached;
    public LocalDateTime computedAt;
    public Integer policyFirstResponseMinutes;
    public Integer policyResolutionMinutes;
}
