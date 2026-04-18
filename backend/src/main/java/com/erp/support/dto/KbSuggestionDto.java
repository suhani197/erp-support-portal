package com.erp.support.dto;
import com.erp.support.enums.AppModule;
import lombok.Data;
@Data public class KbSuggestionDto {
    public Long articleId;
    public String title;
    public AppModule AppModule;
    public String symptoms;
    public double score;
}
