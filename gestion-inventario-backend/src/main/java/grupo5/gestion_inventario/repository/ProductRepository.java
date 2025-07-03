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

    /** Inventario activo de un cliente (filtrado por @Where) */
    List<Product> findByClientId(Long clientId);

    /** Todos los productos de un cliente, incluyendo eliminados lógicamente */
    @Query(value = "SELECT * FROM product WHERE client_id = :clientId", nativeQuery = true)
    List<Product> findAllIncludingDeleted(@Param("clientId") Long clientId);

    /** Productos eliminados lógicamente (papelera) de un cliente */
    @Query(value = "SELECT * FROM product WHERE client_id = :clientId AND active = false", nativeQuery = true)
    List<Product> findDeletedByClient(@Param("clientId") Long clientId);

    /** Marcar un producto como restaurado (active = true) */
    @Modifying
    @Transactional
    @Query(value = "UPDATE product SET active = true WHERE id = :productId AND client_id = :clientId", nativeQuery = true)
    void restore(@Param("clientId") Long clientId, @Param("productId") Long productId);

    /** Productos cuyo stock está en o por debajo del umbral configurado */
    @Query("""
        SELECT COUNT(p) FROM Product p
        WHERE p.client.id = :clientId
          AND p.quantity <= p.lowStockThreshold
    """)
    long countLowStock(@Param("clientId") Long clientId);

    Optional<Product> findByCode(String code);

}
