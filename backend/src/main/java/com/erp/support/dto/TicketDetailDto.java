package com.erp.support.dto;
import com.erp.support.enums.*;
import com.erp.support.enums.AppModule;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
@Data public class TicketDetailDto {
    public Long id;
    public String title;
    public String description;
    public TicketStatus status;
    public Priority priority;
    public AppModule AppModule;
    public UserDto createdBy;
    public UserDto assignedTo;
    public LocalDateTime firstAgentActionAt;
    public LocalDateTime resolvedAt;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public List<CommentDto> comments;
    public SlaMetricsDto sla;
}
