package com.erp.support.dto;
import com.erp.support.enums.UserRole;
import lombok.Data;
@Data public class UserDto {
    public Long id;
    public String email;
    public String fullName;
    public UserRole role;
    public boolean active;
}
