// backend/src/main/java/grupo5/gestion_inventario/model/Product.java
package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import java.math.BigDecimal;

@Entity
@Table(name = "product")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SQLDelete(sql = "UPDATE product SET active = FALSE WHERE id = ?")
@Where(clause = "active = TRUE")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal cost;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int lowStockThreshold;

    @Column(nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore        // se mantendrá mientras migremos lógica que aún usa clientId
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    @JsonIgnore
    private Sucursal sucursal;

    public Product(String code, String name, String description,
                   BigDecimal cost, BigDecimal price, int quantity,
                   int lowStockThreshold, Client client, Sucursal sucursal) {

        this.code              = code;
        this.name              = name;
        this.description       = description;
        this.cost              = cost;
        this.price             = price;
        this.quantity          = quantity;
        this.lowStockThreshold = lowStockThreshold;
        this.client            = client;
        this.sucursal          = sucursal;
        this.active            = true;
    }
}
