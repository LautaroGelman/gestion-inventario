// backend/src/main/java/grupo5/gestion_inventario/clientpanel/repository/PurchaseOrderRepository.java
package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    /* ============================================================
     *  NUEVOS MÉTODOS — FILTRO POR SUCURSAL
     * ============================================================ */

    /** Todas las órdenes de una sucursal */
    List<PurchaseOrder> findBySucursalId(Long sucursalId);

    /** Orden por ID dentro de la sucursal */
    Optional<PurchaseOrder> findByIdAndSucursalId(Long id, Long sucursalId);

    /* ============================================================
     *  LEGACY — MÉTODO BASADO EN clientId
     *  (déjalo comentado o márcalo con @Deprecated mientras migras)
     * ============================================================ */
    /*
    @Deprecated
    List<PurchaseOrder> findByClientId(Long clientId);
    */
}
