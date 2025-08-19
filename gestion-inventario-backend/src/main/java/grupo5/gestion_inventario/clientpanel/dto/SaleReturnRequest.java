// backend/src/main/java/grupo5/gestion_inventario/clientpanel/dto/SaleReturnRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Petición para registrar una devolución.
 * - saleId:      ID de la venta original (obligatorio)
 * - sucursalId:  ID de la sucursal a la que pertenece la venta (setea el controller)
 * - reason:      motivo global de la devolución
 * - items:       líneas devueltas (saleItemId + quantity)
 */
@Setter
@Getter
public class SaleReturnRequest {

    private Long saleId;
    private Long sucursalId;          // ← reemplaza clientId
    private String reason;
    private List<ReturnItemRequest> items;

    public SaleReturnRequest() {}

    public SaleReturnRequest(Long saleId,
                             Long sucursalId,
                             String reason,
                             List<ReturnItemRequest> items) {
        this.saleId     = saleId;
        this.sucursalId = sucursalId;
        this.reason     = reason;
        this.items      = items;
    }



}
