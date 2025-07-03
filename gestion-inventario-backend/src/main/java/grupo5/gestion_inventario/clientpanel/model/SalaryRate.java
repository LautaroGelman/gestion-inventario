package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Employee;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// SalaryRate.java
@Entity
@Table(name = "salary_rates")
@Getter
@Setter
public class SalaryRate {
    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) private Employee employee;
    private BigDecimal hourlyRate;
    @Column(nullable = false) private LocalDate effectiveFrom; // inclusive
}