package com.erp.support.dto;
import com.erp.support.enums.CommentType;
import lombok.Data;
import java.time.LocalDateTime;
@Data public class CommentDto {
    public Long id;
    public UserDto author;
    public String body;
    public CommentType commentType;
    public LocalDateTime createdAt;
}
