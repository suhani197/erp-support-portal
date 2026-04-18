package com.erp.support.entity;

import com.erp.support.enums.AppModule;
import com.erp.support.enums.KbStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "kb_articles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KbArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "module", columnDefinition = "ticket_module")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private AppModule appModule;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "resolution_steps", nullable = false, columnDefinition = "TEXT")
    private String resolutionSteps;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "kb_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private KbStatus status = KbStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToMany
    @JoinTable(name = "kb_article_tags",
               joinColumns = @JoinColumn(name = "article_id"),
               inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
