package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(
        name = "product",
        // Excelente uso de UniqueConstraint para la lógica de negocio.
        uniqueConstraints = @UniqueConstraint(columnNames = {"client_id", "code"})
)
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

    // Esta es la relación con el cliente, el "dueño" del producto.
    @ManyToOne(fetch = FetchType.LAZY) // FetchType.LAZY es una excelente práctica de rendimiento.
    @JoinColumn(name = "client_id", nullable = false)
    // Se elimina @JsonBackReference y se puede usar @JsonIgnore si es necesario,
    // pero al tener @JsonIgnore en el otro lado (en Client), el bucle ya está roto.
    // Dejarlo sin anotación de Jackson es más limpio.
    private Client client;

    // --- Constructores ---
    public Product() {}

    public Product(String code, String name, String description, BigDecimal cost, BigDecimal price, int quantity, int lowStockThreshold, Client client) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.cost = cost;
        this.price = price;
        this.quantity = quantity;
        this.lowStockThreshold = lowStockThreshold;
        this.client = client;
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(int lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
}