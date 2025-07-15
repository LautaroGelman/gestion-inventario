package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// ExpenseCategory.java
@Entity @Table(name = "expense_categories")
@SQLDelete(sql = "UPDATE expense_categories SET active = FALSE WHERE id = ?")
@Where(clause = "active = TRUE")
@Getter
@Setter
public class ExpenseCategory {
    @Id @GeneratedValue private Long id;

    @ManyToOne(fetch = FetchType.LAZY) private Client client;

    @Column(nullable = false, length = 50) private String name;
    private boolean defaultCategory;   // “Sueldos”, “Alquiler”, etc.
    private boolean active = true;     // ↓ desactivable sin romper data
}


