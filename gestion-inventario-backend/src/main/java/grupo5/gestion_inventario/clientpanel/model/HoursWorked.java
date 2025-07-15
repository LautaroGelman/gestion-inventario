package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Employee;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

// HoursWorked.java  (total mensual)
@Entity
@Table(name = "hours_worked")
@Getter
@Setter
@EqualsAndHashCode(of = {"employee","year","month"})
public class HoursWorked {
    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) private Employee employee;
    private int year;   // 2025
    private int month;  // 1-12
    private BigDecimal hours;          // puede ser null si sueldo fijo
}