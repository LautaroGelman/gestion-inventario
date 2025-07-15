// src/grupo5/gestion_inventario/clientpanel/dto/ReturnItemRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

/**
 * DTO para cada línea de devolución:
 * saleItemId = identificador del ítem en la venta original
 * quantity   = cantidad a devolver (<= cantidad vendida)
 */
public class ReturnItemRequest {
    private Long saleItemId;
    private int quantity;

    public ReturnItemRequest() {}

    public ReturnItemRequest(Long saleItemId, int quantity) {
        this.saleItemId = saleItemId;
        this.quantity   = quantity;
    }

    public Long getSaleItemId() {
        return saleItemId;
    }

    public void setSaleItemId(Long saleItemId) {
        this.saleItemId = saleItemId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
