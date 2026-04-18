package com.erp.support.dto;
import lombok.Data;
@Data public class LoginResponse {
    public String token;
    public UserDto user;
}
