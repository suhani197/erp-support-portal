package com.erp.support.dto;
import com.erp.support.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data public class StatusUpdateRequest {
    @NotNull public TicketStatus status;
}
