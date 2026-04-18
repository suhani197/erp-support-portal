package com.erp.support.dto;
import jakarta.validation.constraints.Min;
import lombok.Data;
@Data public class UpdateSlaPolicyRequest {
    @Min(1) public int firstResponseMinutes;
    @Min(1) public int resolutionMinutes;
}
