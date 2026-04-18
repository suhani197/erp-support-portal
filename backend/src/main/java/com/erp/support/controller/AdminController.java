package com.erp.support.controller;

import com.erp.support.dto.*;
import com.erp.support.entity.SlaPolicy;
import com.erp.support.enums.Priority;
import com.erp.support.exception.ResourceNotFoundException;
import com.erp.support.repository.*;
import com.erp.support.service.DashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DashboardService dashboardService;
    private final SlaPolicyRepository slaPolicyRepo;
    private final UserRepository userRepo;
    private final DtoMapper mapper;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummaryDto> summary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/dashboard/agent-workload")
    public ResponseEntity<List<AgentWorkloadDto>> agentWorkload() {
        return ResponseEntity.ok(dashboardService.getAgentWorkload());
    }

    // ── SLA Policies ─────────────────────────────────────────────────────────

    @GetMapping("/sla-policies")
    public ResponseEntity<List<SlaPolicyDto>> getSLAPolicies() {
        return ResponseEntity.ok(slaPolicyRepo.findAll().stream()
                .map(mapper::toSlaPolicyDto).toList());
    }

    @PutMapping("/sla-policies/{priority}")
    public ResponseEntity<SlaPolicyDto> updateSLAPolicy(
            @PathVariable Priority priority,
            @Valid @RequestBody UpdateSlaPolicyRequest req) {
        SlaPolicy policy = slaPolicyRepo.findByPriority(priority)
                .orElseThrow(() -> new ResourceNotFoundException("SLA policy not found: " + priority));
        policy.setFirstResponseMinutes(req.getFirstResponseMinutes());
        policy.setResolutionMinutes(req.getResolutionMinutes());
        return ResponseEntity.ok(mapper.toSlaPolicyDto(slaPolicyRepo.save(policy)));
    }

    // ── User Management ───────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> listUsers() {
        return ResponseEntity.ok(userRepo.findAll().stream()
                .map(mapper::toUserDto).toList());
    }
}
