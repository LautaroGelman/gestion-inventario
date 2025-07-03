// src/main/java/grupo5/gestion_inventario/clientpanel/model/Expense.java
package grupo5.gestion_inventario.clientpanel.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "expenses")                      // ← usa plural para evitar colisión
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Categoría del movimiento (Sueldos, Alquiler, etc.) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ExpenseCategory category;

    /** Solo se completa cuando el gasto es un sueldo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore
    private Client client;

    /** Descripción libre del gasto / ingreso */
    @Column(nullable = false, length = 500)
    private String description;

    /**
     * Monto del movimiento.<br>
     * Positivo  → Ingreso &nbsp;&nbsp;•&nbsp;&nbsp; Negativo → Egreso
     */
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    /** Fecha contable (p. ej. último día del mes al cerrar) */
    @Column(nullable = false)
    private LocalDate date;

    // ——— Constructor de utilidad (sin ID) ———
    public Expense(Client client,
                   ExpenseCategory category,
                   LocalDate date,
                   BigDecimal amount,
                   Employee employee,
                   String description) {
        this.client      = client;
        this.category    = category;
        this.date        = date;
        this.amount      = amount;
        this.employee    = employee;
        this.description = description;
    }
}
