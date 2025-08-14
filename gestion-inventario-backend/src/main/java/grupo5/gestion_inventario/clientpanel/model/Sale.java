// backend/src/main/java/grupo5/gestion_inventario/clientpanel/model/Sale.java
package grupo5.gestion_inventario.clientpanel.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.Sucursal;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sale")
@Getter @Setter
@NoArgsConstructor
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private String paymentMethod;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<SaleItem> items = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    @JsonIgnore
    private Sucursal sucursal;

    /* --- constructores --- */

    public Sale(Client client, Employee employee, Sucursal sucursal,
                String paymentMethod, LocalDateTime saleDate) {

        this.client        = client;
        this.employee      = employee;
        this.sucursal      = sucursal;
        this.paymentMethod = paymentMethod;
        this.createdAt     = (saleDate != null) ? saleDate : LocalDateTime.now();
    }

    public Sale(String paymentMethod, BigDecimal totalAmount,
                Client client, Employee employee, Sucursal sucursal,
                List<SaleItem> items, LocalDateTime saleDate) {

        this(paymentMethod, totalAmount, client, employee, sucursal, saleDate);
        setItems(items);
    }

    private Sale(String paymentMethod, BigDecimal totalAmount,
                 Client client, Employee employee, Sucursal sucursal,
                 LocalDateTime saleDate) {

        this.client        = client;
        this.employee      = employee;
        this.sucursal      = sucursal;
        this.paymentMethod = paymentMethod;
        this.totalAmount   = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        this.createdAt     = (saleDate != null) ? saleDate : LocalDateTime.now();
    }

    /* helpers */

    public void addItem(SaleItem item) {
        item.setSale(this);
        items.add(item);
        recalcTotal();
    }

    public void recalcTotal() {
        totalAmount = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
