// src/main/java/grupo5/gestion_inventario/clientpanel/dto/SaleReturnRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import java.util.List;

/**
 * DTO para la petición de devolución de venta.
 * - saleId:   ID de la venta original
 * - clientId: ID del cliente (seteado en el controller)
 * - reason:   motivo global de la devolución
 * - items:    lista de líneas (saleItemId + cantidad)
 */
public class SaleReturnRequest {
    private Long saleId;
    private Long clientId;                     // ← campo añadido
    private String reason;
    private List<ReturnItemRequest> items;

    public SaleReturnRequest() {}

    public SaleReturnRequest(Long saleId, Long clientId, String reason, List<ReturnItemRequest> items) {
        this.saleId   = saleId;
        this.clientId = clientId;
        this.reason   = reason;
        this.items    = items;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public List<ReturnItemRequest> getItems() {
        return items;
    }

    public void setItems(List<ReturnItemRequest> items) {
        this.items = items;
    }
}
