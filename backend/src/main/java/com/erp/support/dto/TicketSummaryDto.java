package com.erp.support.dto;
import com.erp.support.enums.*;
import com.erp.support.enums.AppModule;
import lombok.Data;

import java.time.LocalDateTime;
@Data public class TicketSummaryDto {
    public Long id;
    public String title;
    public TicketStatus status;
    public Priority priority;
    public AppModule AppModule;
    public UserDto createdBy;
    public UserDto assignedTo;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
