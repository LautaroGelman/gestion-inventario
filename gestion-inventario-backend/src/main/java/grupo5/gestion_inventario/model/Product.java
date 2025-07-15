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
@Getter
@Setter
@AllArgsConstructor
@SQLDelete(sql = "UPDATE product SET active = FALSE WHERE id = ?")
public class Product {

    // --- Getters & Setters ---
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
    private Client client;

    // --- Constructores ---
    public Product() {}

    public Product(String code, String name, String description, BigDecimal cost,
                   BigDecimal price, int quantity, int lowStockThreshold, Client client) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.cost = cost;
        this.price = price;
        this.quantity = quantity;
        this.lowStockThreshold = lowStockThreshold;
        this.client = client;
        this.active = true;
    }

}
