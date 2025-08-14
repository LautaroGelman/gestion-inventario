// src/main/java/grupo5/gestion_inventario/clientpanel/model/Expense.java
package grupo5.gestion_inventario.clientpanel.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.Sucursal;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ExpenseCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore
    private Client client;

    /* NUEVO: sucursal vinculada al movimiento */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    public Expense(Client client, Sucursal sucursal, ExpenseCategory category,
                   LocalDate date, BigDecimal amount,
                   Employee employee, String description) {
        this.client      = client;
        this.sucursal    = sucursal;
        this.category    = category;
        this.date        = date;
        this.amount      = amount;
        this.employee    = employee;
        this.description = description;
    }
}
