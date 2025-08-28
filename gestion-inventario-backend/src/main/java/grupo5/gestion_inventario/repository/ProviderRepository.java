package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderRepository extends JpaRepository<Provider, Long> {

    /** Listar proveedores de un cliente */
    List<Provider> findByClientId(Long clientId);

    /** Buscar proveedor activo por id y cliente */
    Optional<Provider> findByIdAndClientIdAndActiveTrue(Long id, Long clientId);

    /** Listar proveedores activos de un cliente */
    List<Provider> findByClientIdAndActiveTrue(Long clientId);

}
