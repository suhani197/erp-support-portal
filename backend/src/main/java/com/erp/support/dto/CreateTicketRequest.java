package com.erp.support.dto;
import com.erp.support.enums.AppModule;
import com.erp.support.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data public class CreateTicketRequest {
    @NotBlank public String title;
    @NotBlank public String description;
    @NotNull  public Priority priority;
    @NotNull  public AppModule AppModule;
}
