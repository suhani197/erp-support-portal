package com.erp.support.dto;
import com.erp.support.enums.CommentType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data public class AddCommentRequest {
    @NotBlank public String body;
    public CommentType commentType = CommentType.PUBLIC;
}
