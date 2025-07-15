package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Client;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// MonthClosure.java
@Entity
@Table(name = "month_closures")
@Getter
@Setter
public class MonthClosure {
    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) private Client client;
    private int year;
    private int month;
    private LocalDateTime closedAt;
    @Column(unique = true) private String uniqueKey; // "2025-06:clientId"
}
