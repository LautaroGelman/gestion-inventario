// backend/src/main/java/grupo5/gestion_inventario/repository/ProductRepository.java
package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /* ============================================================
     *  MULTI-SUCURSAL
     * ============================================================ */

    /** Inventario activo de una sucursal (filtrado por @Where(active = TRUE)) */
    List<Product> findBySucursalId(Long sucursalId);

    /** Todos los productos de una sucursal, incluyendo soft-deleted (omite @Where) */
    @Query(value = """
        SELECT *
        FROM product
        WHERE sucursal_id = :sucursalId
        ORDER BY name ASC
        """, nativeQuery = true)
    List<Product> findAllIncludingDeletedBySucursal(@Param("sucursalId") Long sucursalId);

    /** Productos eliminados lógicamente de la sucursal (omite @Where) */
    @Query(value = """
        SELECT *
        FROM product
        WHERE sucursal_id = :sucursalId
          AND active = 0
        ORDER BY name ASC
        """, nativeQuery = true)
    List<Product> findDeletedBySucursalId(@Param("sucursalId") Long sucursalId);

    /** Restaurar (soft-undelete) un producto de la sucursal */
    @Modifying
    @Transactional
    @Query(value = """
        UPDATE product
           SET active = 1
         WHERE id          = :productId
           AND sucursal_id = :sucursalId
        """, nativeQuery = true)
    void restore(@Param("sucursalId") Long sucursalId,
                 @Param("productId") Long productId);

    /** Conteo de productos en o por debajo del umbral de stock bajo (sólo activos por @Where) */
    @Query("""
        SELECT COUNT(p) FROM Product p
         WHERE p.sucursal.id = :sucursalId
           AND p.quantity    <= p.lowStockThreshold
        """)
    long countLowStock(@Param("sucursalId") Long sucursalId);

    /* ============================================================
     *  UTILIDADES
     * ============================================================ */

    /** Búsqueda global por código (único) */
    Optional<Product> findByCode(String code);

    /** Listado por cliente navegando relación sucursal → client (para reportes) */
    List<Product> findBySucursalClientId(Long clientId);

    /* ============================================================
     *  LEGACY (comentado)
     * ============================================================ */
    /*
    List<Product> findByClientId(Long clientId);

    @Query(value = "SELECT * FROM product WHERE client_id = :clientId", nativeQuery = true)
    List<Product> findAllIncludingDeleted(@Param("clientId") Long clientId);

    @Query(value = "SELECT * FROM product WHERE client_id = :clientId AND active = 0", nativeQuery = true)
    List<Product> findDeletedByClient(@Param("clientId") Long clientId);

    @Modifying @Transactional
    @Query(value = "UPDATE product SET active = 1 WHERE id = :productId AND client_id = :clientId", nativeQuery = true)
    void restore(@Param("clientId") Long clientId, @Param("productId") Long productId);

    @Query("""
        SELECT COUNT(p) FROM Product p
         WHERE p.client.id = :clientId
           AND p.quantity  <= p.lowStockThreshold
        """)
    long countLowStock(@Param("clientId") Long clientId);
    */
}
