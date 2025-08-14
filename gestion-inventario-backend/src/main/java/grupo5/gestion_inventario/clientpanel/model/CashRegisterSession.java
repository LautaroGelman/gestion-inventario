// backend/src/main/java/grupo5/gestion_inventario/clientpanel/model/CashRegisterSession.java
package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.Sucursal;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cash_register_sessions")
@Getter @Setter
@NoArgsConstructor
public class CashRegisterSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    /* NUEVO: sucursal donde se abre la caja */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDateTime openingTime = LocalDateTime.now();

    private LocalDateTime closingTime;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal initialAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal countedAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal expectedAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal difference;
}
