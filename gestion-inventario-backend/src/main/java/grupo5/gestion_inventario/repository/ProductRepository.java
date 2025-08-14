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
     *  NUEVO MODELO MULTI-SUCURSAL
     * ============================================================ */

    /** Inventario activo de una sucursal (filtrado por @Where) */
    List<Product> findBySucursalId(Long sucursalId);

    /** Todos los productos de una sucursal, incluso soft-deleted */
    @Query(value = "SELECT * FROM product WHERE sucursal_id = :sucursalId",
            nativeQuery = true)
    List<Product> findAllIncludingDeletedBySucursal(@Param("sucursalId") Long sucursalId);

    /** Productos eliminados lógicamente de la sucursal */
    @Query(value = "SELECT * FROM product WHERE sucursal_id = :sucursalId AND active = false",
            nativeQuery = true)
    List<Product> findDeletedBySucursal(@Param("sucursalId") Long sucursalId);

    /** Restaurar (soft-undelete) un producto de la sucursal */
    @Modifying @Transactional
    @Query(value = """
        UPDATE product
           SET active = true
         WHERE id          = :productId
           AND sucursal_id = :sucursalId
    """, nativeQuery = true)
    void restore(@Param("sucursalId") Long sucursalId,
                 @Param("productId") Long productId);

    /** Conteo de productos en o por debajo del umbral de stock bajo */
    @Query("""
        SELECT COUNT(p) FROM Product p
        WHERE p.sucursal.id = :sucursalId
          AND p.quantity    <= p.lowStockThreshold
    """)
    long countLowStock(@Param("sucursalId") Long sucursalId);

    /* ============================================================
     *  BÚSQUEDA GLOBAL POR CÓDIGO
     * ============================================================ */
    Optional<Product> findByCode(String code);

    /* ============================================================
     *  LEGACY — MÉTODOS BASADOS EN clientId
     *  (comentados para referencia; eliminar al finalizar la migración)
     * ============================================================ */
    /*
    // Inventario activo de un cliente
    List<Product> findByClientId(Long clientId);

    // Todos los productos de un cliente, incluyendo eliminados lógicamente
    @Query(value = "SELECT * FROM product WHERE client_id = :clientId", nativeQuery = true)
    List<Product> findAllIncludingDeleted(@Param("clientId") Long clientId);

    // Productos eliminados lógicamente (papelera) de un cliente
    @Query(value = "SELECT * FROM product WHERE client_id = :clientId AND active = false", nativeQuery = true)
    List<Product> findDeletedByClient(@Param("clientId") Long clientId);

    // Restaurar producto para un cliente
    @Modifying @Transactional
    @Query(value = "UPDATE product SET active = true WHERE id = :productId AND client_id = :clientId", nativeQuery = true)
    void restore(@Param("clientId") Long clientId, @Param("productId") Long productId);

    // Conteo de productos con stock bajo para un cliente
    @Query("""
        SELECT COUNT(p) FROM Product p
        WHERE p.client.id = :clientId
          AND p.quantity  <= p.lowStockThreshold
    """)
    long countLowStock(@Param("clientId") Long clientId);
    */
}
