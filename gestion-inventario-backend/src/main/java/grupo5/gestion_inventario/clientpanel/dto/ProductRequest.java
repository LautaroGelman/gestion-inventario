package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;

public class ProductRequest {
    private String code;
    private String name;
    private String description;
    private BigDecimal cost;
    private BigDecimal price;
    private Integer quantity;
    private Integer lowStockThreshold;

    private Integer reorderQtyDefault;
    private Long preferredProviderId;

    // getters/setters...
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

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public Integer getReorderQtyDefault() { return reorderQtyDefault; }
    public void setReorderQtyDefault(Integer reorderQtyDefault) { this.reorderQtyDefault = reorderQtyDefault; }

    public Long getPreferredProviderId() { return preferredProviderId; }
    public void setPreferredProviderId(Long preferredProviderId) { this.preferredProviderId = preferredProviderId; }
}
