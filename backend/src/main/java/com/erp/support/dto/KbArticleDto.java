package com.erp.support.dto;
import com.erp.support.enums.*;
import com.erp.support.enums.AppModule;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
@Data public class KbArticleDto {
    public Long id;
    public String title;
    public AppModule AppModule;
    public String symptoms;
    public String rootCause;
    public String resolutionSteps;
    public KbStatus status;
    public UserDto createdBy;
    public Set<String> tags;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
