// backend/src/main/java/grupo5/gestion_inventario/clientpanel/model/PurchaseOrder.java
package grupo5.gestion_inventario.clientpanel.model;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Provider;
import grupo5.gestion_inventario.model.Sucursal;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
@Getter @Setter
@NoArgsConstructor
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    private Date orderDate;

    @Temporal(TemporalType.TIMESTAMP)
    private Date receptionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    /* NUEVO: sucursal que hace el pedido */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseOrderStatus status;

    @Column(nullable = false)
    private BigDecimal totalCost;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderItem> items = new ArrayList<>();

    public enum PurchaseOrderStatus { PENDING, RECEIVED, CANCELLED }

    @PrePersist
    protected void onCreate() {
        this.orderDate = new Date();
        this.status    = PurchaseOrderStatus.PENDING;
        this.totalCost = BigDecimal.ZERO;
    }

    public void addItem(PurchaseOrderItem item) {
        items.add(item);
        item.setPurchaseOrder(this);
        totalCost = totalCost.add(item.getCost()
                .multiply(BigDecimal.valueOf(item.getQuantity())));
    }
}
