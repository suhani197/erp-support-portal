package com.erp.support.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data public class AssignRequest {
    @NotNull public Long agentId;
}
