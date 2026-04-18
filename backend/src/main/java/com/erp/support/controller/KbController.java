package com.erp.support.controller;

import com.erp.support.dto.*;
import com.erp.support.entity.User;
import com.erp.support.enums.KbStatus;
import com.erp.support.enums.AppModule;
import com.erp.support.service.KbService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kb/articles")
@RequiredArgsConstructor
public class KbController {

    private final KbService kbService;

    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    @PostMapping
    public ResponseEntity<KbArticleDto> create(
            @Valid @RequestBody CreateKbArticleRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kbService.create(req, currentUser));
    }

    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<KbArticleDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateKbArticleRequest req) {
        return ResponseEntity.ok(kbService.update(id, req));
    }

    @GetMapping
    public ResponseEntity<List<KbArticleDto>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) AppModule AppModule,
            @RequestParam(required = false) KbStatus status) {
        return ResponseEntity.ok(kbService.search(keyword, AppModule, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KbArticleDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(kbService.getById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/publish")
    public ResponseEntity<KbArticleDto> publish(@PathVariable Long id) {
        return ResponseEntity.ok(kbService.publish(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/unpublish")
    public ResponseEntity<KbArticleDto> unpublish(@PathVariable Long id) {
        return ResponseEntity.ok(kbService.unpublish(id));
    }
}
