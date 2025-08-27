// backend/src/main/java/grupo5/gestion_inventario/repository/ProviderRepository.java
package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    List<Provider> findByClientId(Long clientId);
}
