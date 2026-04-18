package com.erp.support.dto;

import com.erp.support.entity.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class DtoMapper {

    public UserDto toUserDto(User u) {
        if (u == null) return null;
        var dto = new UserDto();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setRole(u.getRole());
        dto.setActive(u.isActive());
        return dto;
    }

    public TicketSummaryDto toSummary(Ticket t) {
        var dto = new TicketSummaryDto();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setStatus(t.getStatus());
        dto.setPriority(t.getPriority());
        dto.setAppModule(t.getAppModule());
        dto.setCreatedBy(toUserDto(t.getCreatedBy()));
        dto.setAssignedTo(toUserDto(t.getAssignedTo()));
        dto.setCreatedAt(t.getCreatedAt());
        dto.setUpdatedAt(t.getUpdatedAt());
        return dto;
    }

    public TicketDetailDto toDetail(Ticket t, SlaMetrics sla, SlaPolicy policy) {
        var dto = new TicketDetailDto();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setDescription(t.getDescription());
        dto.setStatus(t.getStatus());
        dto.setPriority(t.getPriority());
        dto.setAppModule(t.getAppModule());
        dto.setCreatedBy(toUserDto(t.getCreatedBy()));
        dto.setAssignedTo(toUserDto(t.getAssignedTo()));
        dto.setFirstAgentActionAt(t.getFirstAgentActionAt());
        dto.setResolvedAt(t.getResolvedAt());
        dto.setCreatedAt(t.getCreatedAt());
        dto.setUpdatedAt(t.getUpdatedAt());
        dto.setComments(t.getComments().stream().map(this::toCommentDto).toList());
        if (sla != null) {
            dto.setSla(toSlaMetricsDto(sla, policy));
        }
        return dto;
    }

    public CommentDto toCommentDto(TicketComment c) {
        var dto = new CommentDto();
        dto.setId(c.getId());
        dto.setAuthor(toUserDto(c.getAuthor()));
        dto.setBody(c.getBody());
        dto.setCommentType(c.getCommentType());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    public KbArticleDto toKbArticleDto(KbArticle a) {
        var dto = new KbArticleDto();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setAppModule(a.getAppModule());
        dto.setSymptoms(a.getSymptoms());
        dto.setRootCause(a.getRootCause());
        dto.setResolutionSteps(a.getResolutionSteps());
        dto.setStatus(a.getStatus());
        dto.setCreatedBy(toUserDto(a.getCreatedBy()));
        dto.setTags(a.getTags().stream().map(Tag::getName).collect(Collectors.toSet()));
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        return dto;
    }

    public SlaMetricsDto toSlaMetricsDto(SlaMetrics m, SlaPolicy policy) {
        var dto = new SlaMetricsDto();
        dto.setFirstResponseMinutes(m.getFirstResponseMinutes());
        dto.setResolutionMinutes(m.getResolutionMinutes());
        dto.setFirstResponseBreached(m.isFirstResponseBreached());
        dto.setResolutionBreached(m.isResolutionBreached());
        dto.setComputedAt(m.getComputedAt());
        if (policy != null) {
            dto.setPolicyFirstResponseMinutes(policy.getFirstResponseMinutes());
            dto.setPolicyResolutionMinutes(policy.getResolutionMinutes());
        }
        return dto;
    }

    public SlaPolicyDto toSlaPolicyDto(SlaPolicy p) {
        var dto = new SlaPolicyDto();
        dto.setPriority(p.getPriority());
        dto.setFirstResponseMinutes(p.getFirstResponseMinutes());
        dto.setResolutionMinutes(p.getResolutionMinutes());
        return dto;
    }
}
