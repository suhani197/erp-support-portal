package com.erp.support.dto;
import com.erp.support.enums.Priority;
import lombok.Data;
@Data public class SlaPolicyDto {
    public Priority priority;
    public int firstResponseMinutes;
    public int resolutionMinutes;
}
