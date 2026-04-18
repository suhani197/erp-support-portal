package com.erp.support.service;

import com.erp.support.dto.*;
import com.erp.support.entity.User;
import com.erp.support.exception.ResourceNotFoundException;
import com.erp.support.repository.*;
import com.erp.support.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final DtoMapper mapper;

    public LoginResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!user.isActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        var response = new LoginResponse();
        response.setToken(token);
        response.setUser(mapper.toUserDto(user));
        return response;
    }

    public UserDto me(User currentUser) {
        return mapper.toUserDto(currentUser);
    }
}
