package com.erp.support.dto;
import com.erp.support.enums.AppModule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Set;
@Data public class CreateKbArticleRequest {
    @NotBlank public String title;
    @NotNull  public AppModule AppModule;
    public String symptoms;
    public String rootCause;
    @NotBlank public String resolutionSteps;
    public Set<String> tags;
}
