package com.erp.support.entity;
import com.erp.support.enums.Priority;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name = "sla_policies") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SlaPolicy {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Enumerated(EnumType.STRING) @Column(columnDefinition = "ticket_priority", unique = true) private Priority priority;
    private int firstResponseMinutes;
    private int resolutionMinutes;
    @UpdateTimestamp private LocalDateTime updatedAt;
}
