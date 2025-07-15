package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Client;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// ExpenseTemplate.java  (recurrente o único)
@Entity @Table(name = "expense_templates")
@Getter @Setter
public class ExpenseTemplate {
    @Id @GeneratedValue private Long id;
    @ManyToOne(fetch = FetchType.LAZY) private Client client;
    @ManyToOne(fetch = FetchType.LAZY) private ExpenseCategory category;
    private BigDecimal amount;         // negativo → egreso
    private boolean recurring;         // true = copiar todos los meses
    @Column(nullable = false) private LocalDate effectiveFrom; // inclusive
    private String description;
}
