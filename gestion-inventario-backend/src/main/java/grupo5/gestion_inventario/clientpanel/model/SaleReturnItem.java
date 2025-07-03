// src/main/java/grupo5/gestion_inventario/clientpanel/model/SaleReturnItem.java
package grupo5.gestion_inventario.clientpanel.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Product;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_return_item")
public class SaleReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_return_id", nullable = false)
    @JsonBackReference
    private SaleReturn saleReturn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_item_id", nullable = false)
    private SaleItem saleItem;  // Referencia al ítem original de la venta

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    private String reason;

    // Constructores
    public SaleReturnItem() { }

    public SaleReturnItem(SaleReturn saleReturn,
                          SaleItem saleItem,
                          Product product,
                          int quantity,
                          BigDecimal unitPrice,
                          String reason) {
        this.saleReturn = saleReturn;
        this.saleItem   = saleItem;
        this.product    = product;
        this.quantity   = quantity;
        this.unitPrice  = unitPrice;
        this.reason     = reason;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SaleReturn getSaleReturn() { return saleReturn; }
    public void setSaleReturn(SaleReturn saleReturn) { this.saleReturn = saleReturn; }

    public SaleItem getSaleItem() { return saleItem; }
    public void setSaleItem(SaleItem saleItem) { this.saleItem = saleItem; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}