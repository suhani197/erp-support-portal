package com.erp.support.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "sla_metrics") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SlaMetrics {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ticket_id", unique = true) private Ticket ticket;
    private Integer firstResponseMinutes;
    private Integer resolutionMinutes;
    private boolean firstResponseBreached;
    private boolean resolutionBreached;
    private LocalDateTime computedAt;
}
